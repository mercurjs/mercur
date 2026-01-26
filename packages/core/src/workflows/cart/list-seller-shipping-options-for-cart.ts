import {
    createWorkflow,
    transform,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ShippingOptionDTO } from "@medusajs/framework/types"
import { useQueryGraphStep, validatePresenceOfStep } from "@medusajs/medusa/core-flows"
import { cartFieldsForPricingContext } from "./utils"

export type ListSellerShippingOptionsForCartWorkflowInput = {
    cart_id: string
    is_return?: boolean
    enabled_in_store?: boolean
    fields?: string[]
}

export type ListSellerShippingOptionsForCartWorkflowOutput = Record<string, ShippingOptionDTO[]>

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
                "items.variant.product.id",
                "items.variant.product.seller.id",
                "items.variant.manage_inventory",
                "items.variant.inventory_items.inventory_item_id",
                "items.variant.inventory_items.inventory.requires_shipping",
                "items.variant.inventory_items.inventory.location_levels.*",
            ],
            options: { throwIfKeyNotFound: true },
        }).config({ name: "get-cart" })

        const cart = transform({ cartQuery }, ({ cartQuery }) => cartQuery.data[0])
        const cartSellers = transform({ cart }, ({ cart }) => cart.items.map((item) => item.variant.product.seller.id))

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
            entity: "sales_channel_stock_location",
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

    }
)
