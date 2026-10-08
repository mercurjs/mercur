import { Query } from "@medusajs/framework"
import { MedusaContainer } from "@medusajs/framework/types"
import {
    ContainerRegistrationKeys,
    promiseAll,
} from "@medusajs/framework/utils"
import { PrepareAdjustmentsFromPromotionActionsStepOutput } from "@medusajs/medusa/core-flows"

export type LineItemAdjustmentToCreate =
    PrepareAdjustmentsFromPromotionActionsStepOutput["lineItemAdjustmentsToCreate"][number]
export type ShippingMethodAdjustmentToCreate =
    PrepareAdjustmentsFromPromotionActionsStepOutput["shippingMethodAdjustmentsToCreate"][number]

export type SellerScopedAdjustments = {
    lineItemAdjustmentsToCreate: LineItemAdjustmentToCreate[]
    shippingMethodAdjustmentsToCreate: ShippingMethodAdjustmentToCreate[]
}

/**
 * Seller id per promotion id. A promotion without a seller link is a
 * platform promotion and maps to `null`.
 */
export type PromotionSellerIds = Record<string, string | null>

const unique = (values: Array<string | undefined | null>): string[] =>
    Array.from(
        new Set(values.filter((v): v is string => typeof v === "string" && v.length > 0))
    )

export const loadPromotionSellerIds = async (
    query: Query,
    promotionIds: Array<string | undefined | null>
): Promise<PromotionSellerIds> => {
    const ids = unique(promotionIds)
    if (!ids.length) {
        return {}
    }

    const { data: promotions } = await query.graph(
        {
            entity: "promotion",
            fields: ["id", "seller.id"],
            filters: { id: ids },
        },
        { cache: { enable: true } }
    )

    const result: PromotionSellerIds = {}
    for (const promotion of promotions as Array<{
        id: string
        seller?: { id: string } | null
    }>) {
        result[promotion.id] = promotion.seller?.id ?? null
    }
    return result
}

/**
 * A seller's promotion may only discount that seller's lines and shipping;
 * a platform promotion (no seller link) may discount anything.
 */
export const isAdjustmentInSellerScope = (
    promotionSellerId: string | null | undefined,
    targetSellerId: string | null | undefined
): boolean => !promotionSellerId || promotionSellerId === targetSellerId

export const filterSellerAdjustments = async (
    container: MedusaContainer,
    adjustments: SellerScopedAdjustments
): Promise<SellerScopedAdjustments> => {
    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
    const {
        lineItemAdjustmentsToCreate = [],
        shippingMethodAdjustmentsToCreate = [],
    } = adjustments

    if (!lineItemAdjustmentsToCreate.length && !shippingMethodAdjustmentsToCreate.length) {
        return { lineItemAdjustmentsToCreate: [], shippingMethodAdjustmentsToCreate: [] }
    }

    const [promotionSellerIds, { data: lineItems }, { data: shippingMethods }] =
        await promiseAll([
            loadPromotionSellerIds(
                query,
                [...lineItemAdjustmentsToCreate, ...shippingMethodAdjustmentsToCreate].map(
                    (adjustment) => adjustment.promotion_id
                )
            ),
            query.graph(
                {
                    entity: "line_item",
                    fields: ["id", "offer.seller_id"],
                    filters: {
                        id: unique(lineItemAdjustmentsToCreate.map((a) => a.item_id)),
                    },
                },
                { cache: { enable: true } }
            ),
            query.graph(
                {
                    entity: "shipping_method",
                    fields: ["id", "shipping_option_id"],
                    filters: {
                        id: unique(
                            shippingMethodAdjustmentsToCreate.map((a) => a.shipping_method_id)
                        ),
                    },
                },
                { cache: { enable: true } }
            ),
        ])

    const { data: shippingOptions } = await query.graph(
        {
            entity: "shipping_option",
            fields: ["id", "seller.id"],
            filters: {
                id: unique(
                    (shippingMethods as Array<{ shipping_option_id?: string | null }>).map(
                        (sm) => sm.shipping_option_id
                    )
                ),
            },
        },
        { cache: { enable: true } }
    )

    const lineItemSellerIds = new Map<string, string | null>(
        (lineItems as Array<{ id: string; offer?: { seller_id?: string | null } | null }>).map(
            (lineItem) => [lineItem.id, lineItem.offer?.seller_id ?? null]
        )
    )
    const shippingOptionSellerIds = new Map<string, string | null>(
        (shippingOptions as Array<{ id: string; seller?: { id: string } | null }>).map(
            (option) => [option.id, option.seller?.id ?? null]
        )
    )
    const shippingMethodSellerIds = new Map<string, string | null>(
        (shippingMethods as Array<{ id: string; shipping_option_id?: string | null }>).map(
            (sm) => [
                sm.id,
                sm.shipping_option_id
                    ? (shippingOptionSellerIds.get(sm.shipping_option_id) ?? null)
                    : null,
            ]
        )
    )

    const sellerOfPromotion = (promotionId?: string | null) =>
        promotionId ? (promotionSellerIds[promotionId] ?? null) : null

    return {
        lineItemAdjustmentsToCreate: lineItemAdjustmentsToCreate.filter((adjustment) =>
            isAdjustmentInSellerScope(
                sellerOfPromotion(adjustment.promotion_id),
                lineItemSellerIds.get(adjustment.item_id)
            )
        ),
        shippingMethodAdjustmentsToCreate: shippingMethodAdjustmentsToCreate.filter(
            (adjustment) =>
                isAdjustmentInSellerScope(
                    sellerOfPromotion(adjustment.promotion_id),
                    shippingMethodSellerIds.get(adjustment.shipping_method_id)
                )
        ),
    }
}
