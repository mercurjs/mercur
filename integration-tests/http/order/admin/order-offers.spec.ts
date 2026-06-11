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
import {
    adminHeaders,
    createAdminUser,
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(120000)

/**
 * Admin mirror of `vendor/order-offers.spec.ts`.
 *
 * The admin "add items to order" routes overridden under
 * `packages/core/src/api/admin/{order-edits,exchanges,claims}` accept
 * Medusa's strict `{ variant_id, quantity, metadata? }` payload but
 * read `metadata.offer_id` and resolve it through the shared
 * `resolveOfferItems` helper. That overrides `unit_price` from the
 * offer's price in the order's currency and keeps `metadata.offer_id`
 * for the `link-order-line-items-to-offers` subscriber to attach the
 * `order_line_item ↔ offer` link on confirm.
 *
 * Scope of this spec:
 *   - Happy path: admin add-items with `metadata.offer_id` on the
 *     order's seller resolves to the offer's price.
 *   - An unknown offer id is rejected.
 *   - An offer belonging to a different seller than the order's
 *     seller is rejected (admin still seller-scopes via the
 *     `order_seller` link → `resolveOrderSellerId`).
 *   - The base flow without `metadata.offer_id` still works (default
 *     Medusa behavior is preserved when no offer is provided).
 */

const approveSeller = async (
    container: MedusaContainer,
    sellerId: string
) => {
    const sellerModule: any = container.resolve(MercurModules.SELLER)
    await sellerModule.updateSellers({
        id: sellerId,
        status: SellerStatus.OPEN,
    })
}

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Admin - Offer ID resolution on add-items routes", () => {
            let appContainer: MedusaContainer
            let seller1Seed: any
            let seller2Seed: any
            let storeHeaders: any
            let region: any
            let salesChannel: any
            let prerequisiteCounter = 0

            const seedSellerOfferWithShipping = async (opts: {
                email: string
                name: string
                stocked: number
                offerPrice: number
                currency_code?: string
            }) => {
                const result = await createSellerUser(appContainer, {
                    email: opts.email,
                    name: opts.name,
                })
                await approveSeller(appContainer, (result.seller as any).id)
                const headers = result.headers
                const tag = `_${opts.name}_${Date.now()}_${++prerequisiteCounter}`

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

                const product = (
                    await api.post(
                        `/vendor/products`,
                        {
                            status: "published",
                            title: `Prod${tag}`,
                            variant_attributes: [
                                {
                                    name: `Default${tag}`,
                                    type: "multi_select",
                                    values: ["Default"],
                                    is_variant_axis: true,
                                },
                            ],
                            variants: [
                                {
                                    title: "Default",
                                    sku: `V${tag}`,
                                    attribute_values: {
                                        [`Default${tag}`]: "Default",
                                    },
                                },
                            ],
                        },
                        headers
                    )
                ).data.product

                await api.post(
                    `/vendor/sales-channels/${salesChannel.id}/products`,
                    { add: [product.id] },
                    headers
                )

                const offer = (
                    await api.post(
                        `/vendor/offers`,
                        {
                            sku: `OF${tag}`,
                            variant_id: product.variants[0].id,
                            shipping_profile_id: shippingProfile.id,
                            inventory_items: [
                                {
                                    title: `Inv${tag}`,
                                    required_quantity: 1,
                                    stock_levels: [
                                        {
                                            location_id: stockLocation.id,
                                            stocked_quantity: opts.stocked,
                                        },
                                    ],
                                },
                            ],
                            prices: [
                                {
                                    amount: opts.offerPrice,
                                    currency_code:
                                        opts.currency_code ?? "usd",
                                },
                            ],
                        },
                        headers
                    )
                ).data.offer

                return {
                    sellerId: result.seller.id,
                    headers,
                    product,
                    variant: product.variants[0],
                    offer,
                }
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
                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { data: orderGroup } = await query.graph({
                    entity: "order_group",
                    filters: { id: orderGroupId },
                    fields: ["id", "orders.id"],
                })
                return (orderGroup[0] as any).orders[0]
            }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)

                const customerResult = await createCustomerUser(appContainer, {
                    email: "adminofferbuyer@test.com",
                    first_name: "Offer",
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
                    name: "Admin Offer Channel",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(
                    Modules.REGION
                )
                region = await regionModule.createRegions({
                    name: "Admin Offer Region",
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

                seller1Seed = await seedSellerOfferWithShipping({
                    email: "admin-offer-seller1@test.com",
                    name: "AdminOfferS1",
                    stocked: 20,
                    offerPrice: 2500,
                })

                seller2Seed = await seedSellerOfferWithShipping({
                    email: "admin-offer-seller2@test.com",
                    name: "AdminOfferS2",
                    stocked: 20,
                    offerPrice: 3000,
                })
            })

            describe("POST /admin/order-edits/:id/items with metadata.offer_id", () => {
                it("resolves the offer's unit_price from metadata.offer_id", async () => {
                    const order = await completeCartCheckout(seller1Seed.offer.id)

                    await api.post(
                        `/admin/order-edits`,
                        { order_id: order.id },
                        adminHeaders
                    )

                    const addResp = await api.post(
                        `/admin/order-edits/${order.id}/items`,
                        {
                            items: [
                                {
                                    variant_id: seller1Seed.variant.id,
                                    quantity: 1,
                                    metadata: {
                                        offer_id: seller1Seed.offer.id,
                                    },
                                },
                            ],
                        },
                        adminHeaders
                    )

                    expect(addResp.status).toEqual(200)
                    expect(addResp.data.order_preview).toBeDefined()

                    // The added item's unit_price should match the offer's
                    // price (2500), not whatever default the variant resolved
                    // to. Compare against the original line item's
                    // unit_price as a sanity guard: both come from the same
                    // offer, so they should match.
                    const preview = addResp.data.order_preview
                    const previewItems = (preview.items ?? []) as Array<{
                        variant_id?: string
                        unit_price?: number
                        metadata?: Record<string, unknown> | null
                    }>
                    const addedRow = previewItems.find(
                        (i) =>
                            i.variant_id === seller1Seed.variant.id &&
                            (i.metadata as { offer_id?: string } | null)
                                ?.offer_id === seller1Seed.offer.id
                    )
                    expect(addedRow).toBeDefined()
                    expect(Number(addedRow?.unit_price)).toEqual(2500)
                })

                it("rejects an unknown offer_id", async () => {
                    const order = await completeCartCheckout(seller1Seed.offer.id)

                    await api.post(
                        `/admin/order-edits`,
                        { order_id: order.id },
                        adminHeaders
                    )

                    const response = await api
                        .post(
                            `/admin/order-edits/${order.id}/items`,
                            {
                                items: [
                                    {
                                        variant_id: seller1Seed.variant.id,
                                        quantity: 1,
                                        metadata: {
                                            offer_id: "offer_does_not_exist",
                                        },
                                    },
                                ],
                            },
                            adminHeaders
                        )
                        .catch((e) => e.response)

                    expect([400, 404]).toContain(response.status)
                })

                it("rejects an offer belonging to a different seller than the order's seller", async () => {
                    // Order is for seller1; admin passes seller2's offer_id.
                    // `resolveOrderSellerId` resolves seller1 from the
                    // order_seller link; `resolveOfferItems` then rejects
                    // because seller2's offer fails the seller check.
                    const order = await completeCartCheckout(seller1Seed.offer.id)

                    await api.post(
                        `/admin/order-edits`,
                        { order_id: order.id },
                        adminHeaders
                    )

                    const response = await api
                        .post(
                            `/admin/order-edits/${order.id}/items`,
                            {
                                items: [
                                    {
                                        variant_id: seller2Seed.variant.id,
                                        quantity: 1,
                                        metadata: {
                                            offer_id: seller2Seed.offer.id,
                                        },
                                    },
                                ],
                            },
                            adminHeaders
                        )
                        .catch((e) => e.response)

                    expect([400, 403, 404]).toContain(response.status)
                })

                it("falls back to default Medusa behavior when no offer_id is in metadata", async () => {
                    const order = await completeCartCheckout(seller1Seed.offer.id)

                    await api.post(
                        `/admin/order-edits`,
                        { order_id: order.id },
                        adminHeaders
                    )

                    // No metadata.offer_id, but explicit unit_price so the
                    // underlying Medusa workflow doesn't need to resolve a
                    // variant price in the order's currency.
                    const addResp = await api.post(
                        `/admin/order-edits/${order.id}/items`,
                        {
                            items: [
                                {
                                    variant_id: seller1Seed.variant.id,
                                    quantity: 1,
                                    unit_price: 1000,
                                },
                            ],
                        },
                        adminHeaders
                    )

                    expect(addResp.status).toEqual(200)
                    expect(addResp.data.order_preview).toBeDefined()
                })
            })
        })
    },
})
