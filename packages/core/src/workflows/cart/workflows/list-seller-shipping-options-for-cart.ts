import {
    createHook,
    createWorkflow,
    transform,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData, ShippingOptionDTO } from "@medusajs/framework/types"
import {
    getTranslatedShippingOptionsStep,
    useQueryGraphStep,
    useRemoteQueryStep,
    validatePresenceOfStep,
} from "@medusajs/medusa/core-flows"
import { deduplicate, filterObjectByKeys, isDefined } from "@medusajs/framework/utils"
import { cartFieldsForPricingContext, pricingContextResult, shippingOptionsContextResult } from "../utils"
import {
    computeExpectedDelivery,
    getMarketplaceDefaultLeadtime,
    resolveLeadtimeToShip,
    resolveTransitDays,
    SellerDTO,
    ShippingRuleRequirement,
} from "@mercurjs/types"

type DeliverySeller = {
    id: string
    default_leadtime_to_ship: number | null
    closed_from: string | null
    closed_to: string | null
}

type DeliveryCartItem = {
    offer?: { seller_id?: string | null; leadtime_to_ship?: number | null } | null
}

type GovernedShippingOption = {
    metadata: Record<string, unknown> | null
    seller?: { id: string } | null
    calculated_price?: {
        calculated_amount?: number | null
        is_calculated_price_tax_inclusive?: boolean
    } | null
    service_zone: { fulfillment_set: { location: { id: string } } }
    shipping_rule?: {
        requirement: string
        transit_min_days: number | null
        transit_max_days: number | null
        shipping_zone?: { is_active: boolean } | null
        shipping_method?: { is_active: boolean } | null
    } | null
}

export type ListSellerShippingOptionsForCartWorkflowInput = {
    cart_id: string
    is_return?: boolean
    enabled_in_store?: boolean
    fields?: string[]
} & AdditionalData


export const listSellerShippingOptionsForCartWorkflow = createWorkflow(
    "list-seller-shipping-options-for-cart",
    (input: ListSellerShippingOptionsForCartWorkflowInput) => {
        const cartQuery = useQueryGraphStep({
            entity: "cart",
            filters: { id: input.cart_id },
            fields: [
                ...cartFieldsForPricingContext,
                "items.*",
                "items.variant.id",
                "items.offer.id",
                "items.offer.seller_id",
                "items.offer.inventory_items.id",
                "items.offer.inventory_items.requires_shipping",
                "items.offer.inventory_items.location_levels.*",
                "items.offer.leadtime_to_ship",
            ],
            options: { throwIfKeyNotFound: true },
        }).config({ name: "get-cart" })

        const cart = transform({ cartQuery }, ({ cartQuery }) => cartQuery.data[0])
        const cartSellers = transform({ cart }, ({ cart }) =>
            cart.items
                .map((item: any) => item.offer?.seller_id)
                .filter((id: unknown): id is string => typeof id === "string")
        )

        validatePresenceOfStep({
            entity: cart,
            fields: ["sales_channel_id", "region_id", "currency_code"],
        })

        const sellerStockLocationsQuery = useQueryGraphStep({
            entity: "stock_location_seller",
            filters: { seller_id: cartSellers },
            fields: [
                "stock_location.id",
                "stock_location.name",
                "stock_location.address.*",
                "stock_location.fulfillment_sets.id",
            ],
            options: {
                cache: {
                    enable: true,
                },
            },
        }).config({ name: "seller-stock-locations-query" })

        const stockLocationIds = transform(
            { sellerStockLocationsQuery },
            ({ sellerStockLocationsQuery }) => {
                return sellerStockLocationsQuery.data.map((sl) => sl.stock_location.id)
            }
        )

        const salesChannelStockLocationsQuery = useQueryGraphStep({
            entity: "sales_channel_location",
            filters: {
                sales_channel_id: cart.sales_channel_id,
                stock_location_id: stockLocationIds,
            },
            fields: [
                "stock_location_id",
            ],
            options: {
                cache: {
                    enable: true,
                },
            },
        }).config({ name: "sales-channel-stock-locations-query" })

        const validStockLocations = transform(
            { salesChannelStockLocationsQuery, sellerStockLocationsQuery },
            ({ salesChannelStockLocationsQuery, sellerStockLocationsQuery }) => {
                const validIds = new Set<string>(salesChannelStockLocationsQuery.data.map((sl) => sl.stock_location_id))

                return sellerStockLocationsQuery.data.filter((sl) => validIds.has(sl.stock_location.id))
            }
        )

        const { fulfillmentSetIds } = transform(
            { validStockLocations },
            ({ validStockLocations }) => {
                const fulfillmentSetIds = new Set<string>()

                validStockLocations.forEach((stockLocation) => {
                    stockLocation.stock_location.fulfillment_sets?.forEach((fulfillmentSet) => {
                        fulfillmentSetIds.add(fulfillmentSet.id)
                    })
                })

                return {
                    fulfillmentSetIds: Array.from(fulfillmentSetIds),
                }
            }
        )

        const setPricingContext = createHook(
            "setPricingContext",
            {
                cart: cart,
                fulfillmentSetIds,
                additional_data: input.additional_data,
            },
            {
                resultValidator: pricingContextResult,
            }
        )
        const setPricingContextResult = setPricingContext.getResult()

        const setShippingOptionsContext = createHook(
            "setShippingOptionsContext",
            {
                cart: cart,
                fulfillmentSetIds,
                additional_data: input.additional_data,
            },
            {
                resultValidator: shippingOptionsContextResult,
            }
        )
        const setShippingOptionsContextResult = setShippingOptionsContext.getResult()

        const queryVariables = transform(
            {
                input,
                fulfillmentSetIds,
                cart,
                setPricingContextResult,
                setShippingOptionsContextResult,
            },
            ({
                input,
                fulfillmentSetIds,
                cart,
                setPricingContextResult,
                setShippingOptionsContextResult,
            }) => {
                return {
                    context: {
                        ...(setShippingOptionsContextResult
                            ? setShippingOptionsContextResult
                            : {}),
                        is_return: input.is_return ? "true" : "false",
                        enabled_in_store: !isDefined(input.enabled_in_store)
                            ? "true"
                            : input.enabled_in_store
                                ? "true"
                                : "false",
                    },

                    filters: {
                        fulfillment_set_id: fulfillmentSetIds,
                        address: {
                            country_code: cart.shipping_address?.country_code,
                            province_code: cart.shipping_address?.province,
                            city: cart.shipping_address?.city,
                            postal_expression: cart.shipping_address?.postal_code,
                        },
                    },

                    calculated_price: {
                        context: {
                            ...filterObjectByKeys(cart, cartFieldsForPricingContext),
                            ...(setPricingContextResult ? setPricingContextResult : {}),
                            currency_code: cart.currency_code,
                            region_id: cart.region_id,
                            region: cart.region,
                            customer_id: cart.customer_id,
                            customer: cart.customer,
                        },
                    },
                }
            }
        )

        const fields = transform(input, ({ fields = [] }) => {
            return deduplicate([
                ...fields,
                "id",
                "name",
                "price_type",
                "service_zone_id",
                "shipping_profile_id",
                "provider_id",
                "data",
                "service_zone.fulfillment_set_id",
                "service_zone.fulfillment_set.type",
                "service_zone.fulfillment_set.location.id",
                "service_zone.fulfillment_set.location.address.*",

                "type.id",
                "type.label",
                "type.description",
                "type.code",

                "provider.id",
                "provider.is_enabled",

                "rules.attribute",
                "rules.value",
                "rules.operator",

                "calculated_price.*",
                "prices.*",
                "prices.price_rules.*",
                'seller.id',
                'seller.name',
                'seller.handle',
                "metadata",
                "shipping_rule.id",
                "shipping_rule.requirement",
                "shipping_rule.transit_min_days",
                "shipping_rule.transit_max_days",
                "shipping_rule.shipping_zone.is_active",
                "shipping_rule.shipping_method.is_active",
            ])
        })

        const { data: sellers } = useQueryGraphStep({
            entity: "seller",
            filters: { id: cartSellers },
            fields: ["id", "default_leadtime_to_ship", "closed_from", "closed_to"],
        }).config({ name: "get-cart-sellers-delivery" })

        const { data: stores } = useQueryGraphStep({
            entity: "store",
            fields: ["id", "metadata"],
            options: { cache: { enable: true } },
        }).config({ name: "get-store-delivery-defaults" })

        const shippingOptions = useRemoteQueryStep({
            entry_point: "shipping_options",
            fields,
            variables: queryVariables,
        }).config({ name: "shipping-options-query" })

        const shippingOptionsWithPrice = transform(
            { shippingOptions, cart, sellers, stores },
            ({ shippingOptions, cart, sellers, stores }) => {
                const now = new Date()
                const marketplaceLeadtime = getMarketplaceDefaultLeadtime(
                    stores[0]?.metadata
                )
                const sellerById = new Map(
                    (sellers as unknown as DeliverySeller[]).map((seller) => [seller.id, seller])
                )
                const leadtimeBySeller = new Map<string, number | null>()
                for (const item of cart.items as unknown as DeliveryCartItem[]) {
                    const sellerId = item.offer?.seller_id
                    if (!sellerId) {
                        continue
                    }
                    const leadtime = resolveLeadtimeToShip(
                        item.offer?.leadtime_to_ship,
                        sellerById.get(sellerId)?.default_leadtime_to_ship,
                        marketplaceLeadtime
                    )
                    const current = leadtimeBySeller.get(sellerId)
                    leadtimeBySeller.set(
                        sellerId,
                        leadtime === null
                            ? current ?? null
                            : Math.max(current ?? 0, leadtime)
                    )
                }

                return (shippingOptions as unknown as GovernedShippingOption[])
                    .filter((shippingOption) => {
                        const rule = shippingOption.shipping_rule
                        if (!rule) {
                            return true
                        }
                        return (
                            rule.requirement !== ShippingRuleRequirement.NOT_SUPPORTED &&
                            rule.shipping_zone?.is_active !== false &&
                            rule.shipping_method?.is_active !== false
                        )
                    })
                    .map((shippingOption) => {
                    const sellerId = shippingOption.seller?.id
                    const transit = resolveTransitDays(
                        shippingOption.metadata,
                        shippingOption.shipping_rule
                    )
                    const estimated_delivery =
                        sellerId && (transit.min !== null || transit.max !== null)
                            ? computeExpectedDelivery({
                                  start: now,
                                  leadtimeDays: leadtimeBySeller.get(sellerId) ?? null,
                                  transitMinDays: transit.min,
                                  transitMaxDays: transit.max,
                                  closure: sellerById.get(sellerId),
                              })
                            : null
                    const price = shippingOption.calculated_price

                    const locationId =
                        shippingOption.service_zone.fulfillment_set.location.id

                    const itemsAtLocationWithoutAvailableQuantity = cart.items.filter(
                        (item: any) => {
                            const links = item.offer?.inventory_items ?? []
                            if (!links.length) {
                                return false
                            }

                            return links.some((inventoryItem: any) => {
                                if (!inventoryItem.requires_shipping) {
                                    return false
                                }

                                const level = (inventoryItem.location_levels ?? []).find(
                                    (locationLevel: any) =>
                                        locationLevel.location_id === locationId
                                )

                                return !level
                                    ? true
                                    : Number(level.available_quantity ?? 0) <
                                          Number(item.quantity)
                            })
                        }
                    )

                    return {
                        ...shippingOption,
                        amount: price?.calculated_amount,
                        is_tax_inclusive: !!price?.is_calculated_price_tax_inclusive,
                        insufficient_inventory:
                            itemsAtLocationWithoutAvailableQuantity.length > 0,
                        estimated_delivery,
                    }
                }) as unknown as ShippingOptionDTO[]
            }
        )

        const translatedShippingOptions = getTranslatedShippingOptionsStep({
            shippingOptions: shippingOptionsWithPrice,
            locale: cart.locale,
        })

        const sellerShippingOptionsMap = transform(
            { translatedShippingOptions },
            ({ translatedShippingOptions }) => {
                const result: Record<string, ShippingOptionDTO[]> = {}

                translatedShippingOptions.forEach((option_) => {
                    const option = option_ as ShippingOptionDTO & { seller: SellerDTO }
                    const sellerId = option.seller?.id
                    if (!sellerId) return

                    if (!result[sellerId]) {
                        result[sellerId] = []
                    }

                    result[sellerId].push(option)
                })

                return result
            }
        )

        return new WorkflowResponse(sellerShippingOptionsMap, {
            hooks: [setPricingContext, setShippingOptionsContext] as const,
        })
    }
)
