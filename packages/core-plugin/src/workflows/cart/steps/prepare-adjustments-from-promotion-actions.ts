import { Query } from "@medusajs/framework"
import {
    AddItemAdjustmentAction,
    AddShippingMethodAdjustment,
    ComputeActions,
    PromotionDTO,
    RemoveItemAdjustmentAction,
    RemoveShippingMethodAdjustment,
} from "@medusajs/framework/types"
import {
    ComputedActions,
    ContainerRegistrationKeys,
    promiseAll,
} from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PrepareAdjustmentsFromPromotionActionsStepOutput } from "@medusajs/medusa/core-flows"


export interface PrepareSellerAdjustmentsFromPromotionActionsStepInput {
    actions: ComputeActions[]
}

export const prepareSellerAdjustmentsFromPromotionActionsStep = createStep(
    "prepare-seller-adjustments-from-promotion-actions",
    async (
        data: PrepareSellerAdjustmentsFromPromotionActionsStepInput,
        { container }
    ) => {
        const query: Query = container.resolve(ContainerRegistrationKeys.QUERY)

        const { actions = [] } = data

        if (!actions.length) {
            return new StepResponse({
                lineItemAdjustmentsToCreate: [],
                lineItemAdjustmentIdsToRemove: [],
                shippingMethodAdjustmentsToCreate: [],
                shippingMethodAdjustmentIdsToRemove: [],
                computedPromotionCodes: [],
            } as PrepareAdjustmentsFromPromotionActionsStepOutput)
        }

        const [{ data: promotions }, { data: lineItems }, { data: shippingMethods }] = await promiseAll([query.graph(
            {
                entity: "promotion",
                fields: ["id", "code", 'seller.id'],
                filters: { code: actions.map((a) => a.code) },
            },
            { cache: { enable: true } },
        ), query.graph(
            {
                entity: "line_item",
                fields: ['id', 'variant.id', 'variant.product.id', 'variant.product.seller.id'],
                filters: { id: actions.filter((a) => a.action === ComputedActions.ADD_ITEM_ADJUSTMENT).map((a) => (a as AddItemAdjustmentAction).item_id) },
            },
            { cache: { enable: true } },
        ), query.graph(
            {
                entity: "shipping_method",
                fields: ['id', 'shipping_option_id'],
                filters: { id: actions.filter((a) => a.action === ComputedActions.ADD_SHIPPING_METHOD_ADJUSTMENT).map((a) => (a as AddShippingMethodAdjustment).shipping_method_id) },
            },
            { cache: { enable: true } },
        )])
        const { data: shippingOptions } = await query.graph(
            {
                entity: "shipping_option",
                fields: ['id', 'seller.id'],
                filters: { id: shippingMethods.map((sm) => sm.shipping_option_id) },
            },
            { cache: { enable: true } },
        )

        const promotionsMap = new Map<string, PromotionDTO & { seller?: { id: string } }>(
            promotions.map((promotion) => [promotion.code!, promotion])
        )
        const shippingMethodsMap = new Map<string, { id: string, shipping_option_id: string, }>(
            shippingMethods.map((shippingMethod) => [shippingMethod.id!, shippingMethod])
        )
        const shippingOptionsMap = new Map<string, { id: string, seller?: { id: string } }>(
            shippingOptions.map((shippingOption) => [shippingOption.id!, shippingOption])
        )
        const lineItemsMap = new Map<string, { id: string, variant: { id: string, product: { id: string, seller?: { id: string } } } }>(
            lineItems.map((lineItem) => [lineItem.id!, lineItem])
        )

        const lineItemAdjustmentsToCreate: PrepareAdjustmentsFromPromotionActionsStepOutput["lineItemAdjustmentsToCreate"] =
            []
        const lineItemAdjustmentIdsToRemove: string[] = []
        const shippingMethodAdjustmentsToCreate: PrepareAdjustmentsFromPromotionActionsStepOutput["shippingMethodAdjustmentsToCreate"] =
            []
        const shippingMethodAdjustmentIdsToRemove: string[] = []

        for (const action of actions) {
            switch (action.action) {
                case ComputedActions.ADD_ITEM_ADJUSTMENT:
                    const itemAction = action as AddItemAdjustmentAction
                    const promotion = promotionsMap.get(itemAction.code)
                    const lineItem = lineItemsMap.get(itemAction.item_id)

                    if (promotion && lineItem) {
                        const promotionSellerId = promotion.seller?.id
                        const itemSellerId = lineItem.variant?.product?.seller?.id

                        // If promotion has no seller, add adjustment for all items
                        // If promotion has a seller, only add if it matches the item's seller
                        if (!promotionSellerId || promotionSellerId === itemSellerId) {
                            lineItemAdjustmentsToCreate.push({
                                code: action.code,
                                amount: itemAction.amount as number,
                                is_tax_inclusive: itemAction.is_tax_inclusive,
                                item_id: itemAction.item_id,
                                promotion_id: promotion.id,
                            } as PrepareAdjustmentsFromPromotionActionsStepOutput["lineItemAdjustmentsToCreate"][number])
                        }
                    }
                    break
                case ComputedActions.REMOVE_ITEM_ADJUSTMENT:
                    lineItemAdjustmentIdsToRemove.push(
                        (action as RemoveItemAdjustmentAction).adjustment_id
                    )
                    break
                case ComputedActions.ADD_SHIPPING_METHOD_ADJUSTMENT:
                    const shippingAction = action as AddShippingMethodAdjustment
                    const shippingMethod = shippingMethodsMap.get(shippingAction.shipping_method_id)
                    const shippingOption = shippingOptionsMap.get(shippingMethod?.shipping_option_id!)
                    const shippingPromotion = promotionsMap.get(action.code)

                    if (shippingMethod && shippingPromotion) {
                        const promotionSellerId = shippingPromotion.seller?.id
                        const shippingMethodSellerId = shippingOption?.seller?.id

                        // If promotion has no seller, add adjustment for all shipping methods
                        // If promotion has a seller, only add if it matches the shipping method's seller
                        if (!promotionSellerId || promotionSellerId === shippingMethodSellerId) {
                            shippingMethodAdjustmentsToCreate.push({
                                code: action.code,
                                amount: shippingAction.amount as number,
                                shipping_method_id: shippingAction.shipping_method_id,
                                promotion_id: shippingPromotion.id,
                            })
                        }
                    }
                    break
                case ComputedActions.REMOVE_SHIPPING_METHOD_ADJUSTMENT:
                    shippingMethodAdjustmentIdsToRemove.push(
                        (action as RemoveShippingMethodAdjustment).adjustment_id
                    )
                    break
            }
        }

        const computedPromotionCodes = [
            ...lineItemAdjustmentsToCreate,
            ...shippingMethodAdjustmentsToCreate,
        ].map((adjustment) => adjustment.code)

        return new StepResponse({
            lineItemAdjustmentsToCreate,
            lineItemAdjustmentIdsToRemove,
            shippingMethodAdjustmentsToCreate,
            shippingMethodAdjustmentIdsToRemove,
            computedPromotionCodes,
        } as PrepareAdjustmentsFromPromotionActionsStepOutput)
    }
)