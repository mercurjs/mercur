import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import { createVendorProduct } from "../../../helpers/create-product"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(180000)

/**
 * MER-187 — allocate a *newly added* order line item.
 *
 * Repro for "Once I add new item to order and want to allocate it - status
 * doesn't change". Flow:
 *   1. Place an order for offer A (auto-reserved on checkout).
 *   2. Order-edit: add a second offer (offer B) line item, confirm.
 *   3. The added item ends up with NO reservation (offer link is created by
 *      the confirm subscriber *after* the reservation-adjust step runs).
 *   4. The vendor allocates it manually via POST /vendor/reservations.
 *   5. GET /vendor/reservations?line_item_id=... must return the reservation
 *      so the order summary badge flips to "Allocated".
 */

const approveSeller = async (container: MedusaContainer, sellerId: string) => {
    const sellerModule: any = container.resolve(MercurModules.SELLER)
    await sellerModule.updateSellers({
        id: sellerId,
        status: SellerStatus.OPEN,
    })
}

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Allocate newly added order item (MER-187)", () => {
            let appContainer: MedusaContainer
            let storeHeaders: any
            let region: any
            let salesChannel: any
            let counter = 0

            const seedSeller = async (opts: { email: string; name: string }) => {
                const result = await createSellerUser(appContainer, {
                    email: opts.email,
                    name: opts.name,
                })
                await approveSeller(appContainer, (result.seller as any).id)
                const headers = result.headers
                const tag = `_${opts.name}_${Date.now()}_${++counter}`

                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `Warehouse${tag}` },
                        headers
                    )
                ).data.stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    { name: `FS${tag}`, type: "shipping" },
                    headers
                )
                const fulfillmentSet = (
                    await api.get(
                        `/vendor/stock-locations/${stockLocation.id}?fields=*fulfillment_sets`,
                        headers
                    )
                ).data.stock_location.fulfillment_sets[0]
                const serviceZone = (
                    await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: `SZ${tag}`,
                            geo_zones: [{ type: "country", country_code: "us" }],
                        },
                        headers
                    )
                ).data.fulfillment_set.service_zones.find(
                    (z: any) => z.name === `SZ${tag}`
                )
                const shippingProfile = (
                    await api.post(
                        `/vendor/shipping-profiles`,
                        { name: `SP${tag}`, type: "default" },
                        headers
                    )
                ).data.shipping_profile

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-providers`,
                    { add: ["manual_manual"] },
                    headers
                )
                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
                    { add: [salesChannel.id] },
                    headers
                )
                await api.post(
                    `/vendor/shipping-options`,
                    {
                        name: `Ship${tag}`,
                        service_zone_id: serviceZone.id,
                        shipping_profile_id: shippingProfile.id,
                        provider_id: "manual_manual",
                        price_type: "flat",
                        type: {
                            label: "Standard",
                            description: "Standard",
                            code: "standard",
                        },
                        prices: [{ currency_code: "usd", amount: 500 }],
                        rules: [
                            {
                                attribute: "enabled_in_store",
                                value: "true",
                                operator: "eq",
                            },
                        ],
                    },
                    headers
                )

                return { sellerId: result.seller.id, headers, stockLocation, shippingProfile }
            }

            const createOffer = async (
                seed: { headers: any; stockLocation: any; shippingProfile: any },
                opts: { stocked: number; offerPrice: number }
            ) => {
                const tag = `_offer_${Date.now()}_${++counter}`

                const product = await createVendorProduct(api, seed.headers, {
                    title: `Prod${tag}`,
                    sku: `V${tag}`,
                })

                await api.post(
                    `/vendor/sales-channels/${salesChannel.id}/products`,
                    { add: [product.id] },
                    seed.headers
                )

                const offer = (
                    await api.post(
                        `/vendor/offers`,
                        {
                            sku: `OF${tag}`,
                            variant_id: product.variants[0].id,
                            shipping_profile_id: seed.shippingProfile.id,
                            inventory_items: [
                                {
                                    title: `Inv${tag}`,
                                    required_quantity: 1,
                                    stock_levels: [
                                        {
                                            location_id: seed.stockLocation.id,
                                            stocked_quantity: opts.stocked,
                                        },
                                    ],
                                },
                            ],
                            prices: [
                                { amount: opts.offerPrice, currency_code: "usd" },
                            ],
                        },
                        seed.headers
                    )
                ).data.offer

                return { product, variant: product.variants[0], offer }
            }

            const completeCartCheckout = async (offerId: string) => {
                const cart = (
                    await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders
                    )
                ).data.cart

                await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    { offer_id: offerId, quantity: 1 },
                    storeHeaders
                )

                await api.post(
                    `/store/carts/${cart.id}`,
                    {
                        email: "buyer@test.com",
                        shipping_address: {
                            first_name: "Buyer",
                            last_name: "Test",
                            address_1: "123 Main St",
                            city: "New York",
                            country_code: "us",
                            postal_code: "10001",
                        },
                        billing_address: {
                            first_name: "Buyer",
                            last_name: "Test",
                            address_1: "123 Main St",
                            city: "New York",
                            country_code: "us",
                            postal_code: "10001",
                        },
                    },
                    storeHeaders
                )

                const shippingOptionsResp = await api.get(
                    `/store/shipping-options?cart_id=${cart.id}`,
                    storeHeaders
                )
                const allOptions = Object.values(
                    shippingOptionsResp.data.shipping_options as Record<
                        string,
                        any[]
                    >
                ).flat()
                for (const opt of allOptions) {
                    await api.post(
                        `/store/carts/${cart.id}/shipping-methods`,
                        { option_id: opt.id },
                        storeHeaders
                    )
                }

                const paymentCollection = (
                    await api.post(
                        `/store/payment-collections`,
                        { cart_id: cart.id },
                        storeHeaders
                    )
                ).data.payment_collection
                await api.post(
                    `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
                    { provider_id: "pp_system_default" },
                    storeHeaders
                )

                const completeResp = await api.post(
                    `/store/carts/${cart.id}/complete`,
                    {},
                    storeHeaders
                )
                const orderGroupId = completeResp.data.order_group.id
                const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
                const { data: orderGroup } = await query.graph({
                    entity: "order_group",
                    filters: { id: orderGroupId },
                    fields: ["id", "orders.id", "orders.items.id"],
                })
                return (orderGroup[0] as any).orders[0]
            }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const customerResult = await createCustomerUser(appContainer, {
                    email: "allocate-add-buyer@test.com",
                    first_name: "Allocate",
                    last_name: "Buyer",
                })
                const apiKey = await generatePublishableKey(appContainer)
                const baseStoreHeaders = generateStoreHeaders({
                    publishableKey: apiKey,
                })
                storeHeaders = {
                    headers: {
                        ...baseStoreHeaders.headers,
                        ...customerResult.headers.headers,
                    },
                }

                const salesChannelModule =
                    appContainer.resolve<ISalesChannelModuleService>(
                        Modules.SALES_CHANNEL
                    )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "AllocateAdd Channel",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(
                    Modules.REGION
                )
                region = await regionModule.createRegions({
                    name: "AllocateAdd Region",
                    currency_code: "usd",
                    countries: ["us"],
                })

                const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: {
                        payment_provider_id: "pp_system_default",
                    },
                })
            })

            it("allocates a manually-added order item and surfaces its reservation", async () => {
                const seed = await seedSeller({
                    email: "allocate-add-s1@test.com",
                    name: "AllocateAddS1",
                })

                const offerA = await createOffer(seed, {
                    stocked: 100,
                    offerPrice: 2500,
                })
                const offerB = await createOffer(seed, {
                    stocked: 100,
                    offerPrice: 3000,
                })

                const order = await completeCartCheckout(offerA.offer.id)
                const originalLineItemId = order.items[0].id

                // Add offer B as a new line item via order edit (the vendor UI path).
                await api.post(
                    `/vendor/order-edits`,
                    { order_id: order.id },
                    seed.headers
                )
                const addResp = await api.post(
                    `/vendor/order-edits/${order.id}/items`,
                    { items: [{ offer_id: offerB.offer.id, quantity: 1 }] },
                    seed.headers
                )
                expect(addResp.status).toEqual(200)

                await api.post(
                    `/vendor/order-edits/${order.id}/request`,
                    {},
                    seed.headers
                )
                const confirmResp = await api.post(
                    `/vendor/order-edits/${order.id}/confirm`,
                    {},
                    seed.headers
                )
                expect(confirmResp.status).toEqual(200)

                const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)

                // The order_line_item ↔ offer link is created asynchronously by
                // the `link-order-line-items-to-offers` subscriber on the
                // `order-edit.confirmed` event. Poll until the added item is
                // linked, mirroring the vendor UI which only shows the allocate
                // action once the offer link (and its inventory_item_link) is
                // present.
                type ItemWithOffer = {
                    id: string
                    offer?: {
                        id?: string
                        inventory_item_link?: Array<{
                            inventory_item_id?: string
                            inventory_item?: { id?: string }
                        }>
                    }
                }

                let addedItem: ItemWithOffer | undefined
                for (let attempt = 0; attempt < 30; attempt++) {
                    const { data: ordersAfter } = await query.graph({
                        entity: "order",
                        fields: [
                            "id",
                            "items.id",
                            "items.quantity",
                            "items.offer.id",
                            "items.offer.inventory_item_link.inventory_item_id",
                            "items.offer.inventory_item_link.inventory_item.id",
                        ],
                        filters: { id: order.id },
                    })
                    const itemsAfter = (ordersAfter[0] as any)
                        .items as ItemWithOffer[]
                    addedItem = itemsAfter.find((i) => i.id !== originalLineItemId)
                    if (addedItem?.offer?.inventory_item_link?.length) {
                        break
                    }
                    await new Promise((r) => setTimeout(r, 250))
                }

                expect(addedItem).toBeDefined()

                const inventoryItemId =
                    addedItem!.offer?.inventory_item_link?.[0]?.inventory_item
                        ?.id ??
                    addedItem!.offer?.inventory_item_link?.[0]?.inventory_item_id
                expect(inventoryItemId).toBeTruthy()

                // Vendor allocates the added item from the allocate-items form.
                const allocateResp = await api.post(
                    `/vendor/reservations`,
                    {
                        location_id: seed.stockLocation.id,
                        inventory_item_id: inventoryItemId,
                        line_item_id: addedItem!.id,
                        quantity: 1,
                    },
                    seed.headers
                )
                expect(allocateResp.status).toEqual(200)

                // The order summary queries reservations for *all* line items
                // at once (one badge per item). Both the original and the
                // newly allocated item must come back so the added item's badge
                // flips to "Allocated".
                const listResp = await api.get(
                    `/vendor/reservations?line_item_id[]=${originalLineItemId}&line_item_id[]=${addedItem!.id}&limit=100`,
                    seed.headers
                )
                expect(listResp.status).toEqual(200)
                const reservations = listResp.data.reservations as Array<{
                    line_item_id: string
                }>

                const reservedLineItemIds = new Set(
                    reservations.map((r) => r.line_item_id)
                )
                expect(reservedLineItemIds.has(originalLineItemId)).toBe(true)
                expect(reservedLineItemIds.has(addedItem!.id)).toBe(true)

                // The added item must hold exactly one reservation — no
                // duplicates that would push past the summary's per-item limit.
                expect(
                    reservations.filter((r) => r.line_item_id === addedItem!.id)
                        .length
                ).toEqual(1)
            })
        })
    },
})
