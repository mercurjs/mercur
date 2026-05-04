import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    ICustomerModuleService,
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { createSellerUser } from "../../../helpers/create-seller-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
    adminHeaders,
    createAdminUser,
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"

type AuthHeaders = { headers: Record<string, string> }

jest.setTimeout(240000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("admin transfer ownership invariants (FR-BUG-3, FR-BUG-4)", () => {
            let appContainer: MedusaContainer
            let sellerHeaders: AuthHeaders
            let storeHeaders: AuthHeaders
            let region: { id: string; currency_code: string }
            let salesChannel: { id: string }
            let stockLocation: { id: string }
            let variant: string
            let recipientCustomerId: string

            // Per-test fresh setup (same rationale as
            // cancel-order-invariant.spec.ts — publishable-key state goes
            // stale across tests).
            let suffix = 0

            beforeAll(async () => {
                appContainer = getContainer()
                await createAdminUser(dbConnection, adminHeaders, appContainer)
            })

            beforeEach(async () => {
                suffix++

                const sellerResult = await createSellerUser(appContainer, {
                    email: `transfer-invariant-seller-${suffix}@test.com`,
                    name: `Transfer Invariant Seller ${suffix}`,
                })
                sellerHeaders = sellerResult.headers

                const customer = await createCustomerUser(appContainer, {
                    email: `transfer-invariant-current-${suffix}@test.com`,
                    first_name: "Current",
                    last_name: "Owner",
                })

                // Recipient customer (the "new owner" target). Medusa's
                // requestOrderTransferWorkflow rejects guest recipients
                // (`!customer.has_account`), so we create the recipient
                // with `has_account: true` directly via the customer
                // module — no auth flow needed.
                const customerModule =
                    appContainer.resolve<ICustomerModuleService>(
                        Modules.CUSTOMER,
                    )
                const recipient = await customerModule.createCustomers({
                    first_name: "Recipient",
                    last_name: "Owner",
                    email: `transfer-invariant-recipient-${suffix}@test.com`,
                    has_account: true,
                })
                recipientCustomerId = recipient.id

                const apiKey = await generatePublishableKey(appContainer)
                const baseStoreHeaders = generateStoreHeaders({
                    publishableKey: apiKey,
                })
                storeHeaders = {
                    headers: {
                        ...baseStoreHeaders.headers,
                        ...customer.headers.headers,
                    },
                }

                const salesChannelModule =
                    appContainer.resolve<ISalesChannelModuleService>(
                        Modules.SALES_CHANNEL,
                    )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: `Transfer Invariant Store ${suffix}`,
                })

                const regionModule =
                    appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: `Transfer Invariant Region ${suffix}`,
                    currency_code: "usd",
                    countries: ["us"],
                })

                const link = appContainer.resolve(
                    ContainerRegistrationKeys.LINK,
                )
                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: {
                        payment_provider_id: "pp_system_default",
                    },
                })

                const product = (
                    await api.post(
                        `/vendor/products`,
                        {
                            status: "published",
                            title: `Transfer Invariant Product ${suffix}`,
                            options: [{ title: "Size", values: ["M"] }],
                            variants: [
                                {
                                    title: "Medium",
                                    sku: `TI-${suffix}`,
                                    options: { Size: "M" },
                                    prices: [
                                        { currency_code: "usd", amount: 2000 },
                                    ],
                                    manage_inventory: false,
                                },
                            ],
                            sales_channels: [{ id: salesChannel.id }],
                        },
                        sellerHeaders,
                    )
                ).data.product
                variant = product.variants[0].id

                stockLocation = await setupStockLocation()
            })

            let prereqCounter = 0

            const setupStockLocation = async () => {
                const localSuffix = `_ti_${Date.now()}_${++prereqCounter}`

                const sl = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `TI-loc${localSuffix}` },
                        sellerHeaders,
                    )
                ).data.stock_location

                await api.post(
                    `/vendor/stock-locations/${sl.id}/fulfillment-sets`,
                    {
                        name: `TI-fs${localSuffix}`,
                        type: "shipping",
                    },
                    sellerHeaders,
                )

                const updatedLocation = await api.get(
                    `/vendor/stock-locations/${sl.id}?fields=*fulfillment_sets`,
                    sellerHeaders,
                )
                const fulfillmentSet =
                    updatedLocation.data.stock_location.fulfillment_sets[0]

                const serviceZoneResp = await api.post(
                    `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                    {
                        name: `TI-sz${localSuffix}`,
                        geo_zones: [{ type: "country", country_code: "us" }],
                    },
                    sellerHeaders,
                )
                const serviceZone =
                    serviceZoneResp.data.fulfillment_set.service_zones.find(
                        (z: { name: string }) =>
                            z.name === `TI-sz${localSuffix}`,
                    )

                const shippingProfile = (
                    await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: `TI-sp${localSuffix}`,
                            type: "default",
                        },
                        sellerHeaders,
                    )
                ).data.shipping_profile

                await api.post(
                    `/vendor/stock-locations/${sl.id}/fulfillment-providers`,
                    { add: ["manual_manual"] },
                    sellerHeaders,
                )
                await api.post(
                    `/vendor/stock-locations/${sl.id}/sales-channels`,
                    { add: [salesChannel.id] },
                    sellerHeaders,
                )

                await api.post(
                    `/vendor/shipping-options`,
                    {
                        name: `TI-out${localSuffix}`,
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
                            {
                                attribute: "is_return",
                                value: "false",
                                operator: "eq",
                            },
                        ],
                    },
                    sellerHeaders,
                )

                return sl
            }

            const seedPaidOrder = async () => {
                const cart = (
                    await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders,
                    )
                ).data.cart

                await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    { variant_id: variant, quantity: 1 },
                    storeHeaders,
                )

                const shippingOptions = (
                    await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders,
                    )
                ).data.shipping_options as Record<string, any[]>
                for (const [, opts] of Object.entries(shippingOptions)) {
                    if (opts.length > 0) {
                        await api.post(
                            `/store/carts/${cart.id}/shipping-methods`,
                            { option_id: opts[0].id },
                            storeHeaders,
                        )
                    }
                }

                const paymentCollection = (
                    await api.post(
                        `/store/payment-collections`,
                        { cart_id: cart.id },
                        storeHeaders,
                    )
                ).data.payment_collection

                await api.post(
                    `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
                    { provider_id: "pp_system_default" },
                    storeHeaders,
                )

                const orderGroup = (
                    await api.post(
                        `/store/carts/${cart.id}/complete`,
                        {},
                        storeHeaders,
                    )
                ).data.order_group

                const order = (
                    await api.get(
                        `/store/order-groups/${orderGroup.id}?fields=*orders`,
                        storeHeaders,
                    )
                ).data.order_group.orders[0]

                return order
            }

            describe("FR-BUG-4 — POST /admin/orders/:id/transfer rejects on canceled order", () => {
                it("rejects transfer on canceled order with 400 + ORDER_CANCELED_NO_TRANSFER", async () => {
                    const order = await seedPaidOrder()

                    // Cancel the order via admin endpoint.
                    await api.post(
                        `/admin/orders/${order.id}/cancel`,
                        {},
                        adminHeaders,
                    )

                    const response = await api
                        .post(
                            `/admin/orders/${order.id}/transfer`,
                            { customer_id: recipientCustomerId },
                            adminHeaders,
                        )
                        .catch((err) => err.response)

                    expect(response.status).toEqual(400)
                    expect(response.data.code).toEqual(
                        "ORDER_CANCELED_NO_TRANSFER",
                    )
                })
            })

            describe("FR-BUG-3 — POST /admin/orders/:id/transfer rejects when active transfer exists", () => {
                it("happy path: first transfer request succeeds", async () => {
                    const order = await seedPaidOrder()

                    const response = await api.post(
                        `/admin/orders/${order.id}/transfer`,
                        { customer_id: recipientCustomerId },
                        adminHeaders,
                    )

                    expect(response.status).toEqual(200)
                })

                it("rejects second transfer with 400 + ORDER_TRANSFER_REQUEST_ALREADY_ACTIVE", async () => {
                    const order = await seedPaidOrder()

                    // First transfer — should succeed (creates active request).
                    await api.post(
                        `/admin/orders/${order.id}/transfer`,
                        { customer_id: recipientCustomerId },
                        adminHeaders,
                    )

                    // Second transfer — must be rejected by Mercur invariant.
                    const response = await api
                        .post(
                            `/admin/orders/${order.id}/transfer`,
                            { customer_id: recipientCustomerId },
                            adminHeaders,
                        )
                        .catch((err) => err.response)

                    expect(response.status).toEqual(400)
                    expect(response.data.code).toEqual(
                        "ORDER_TRANSFER_REQUEST_ALREADY_ACTIVE",
                    )
                })
            })
        })
    },
})
