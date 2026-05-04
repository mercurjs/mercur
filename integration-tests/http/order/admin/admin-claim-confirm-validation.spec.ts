import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
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
        describe("admin claim confirm validation (FR-BUG-8, FR-BUG-9)", () => {
            let appContainer: MedusaContainer
            let sellerHeaders: AuthHeaders
            let storeHeaders: AuthHeaders
            let region: { id: string; currency_code: string }
            let salesChannel: { id: string }
            let stockLocation: { id: string }
            let variant: string

            // Per-test fresh setup. Same rationale as
            // cancel-order-invariant.spec.ts — publishable-key state
            // goes stale across tests.
            let suffix = 0

            beforeAll(async () => {
                appContainer = getContainer()
                await createAdminUser(dbConnection, adminHeaders, appContainer)
            })

            beforeEach(async () => {
                suffix++

                const sellerResult = await createSellerUser(appContainer, {
                    email: `claim-validation-seller-${suffix}@test.com`,
                    name: `Claim Validation Seller ${suffix}`,
                })
                sellerHeaders = sellerResult.headers

                const customer = await createCustomerUser(appContainer, {
                    email: `claim-validation-customer-${suffix}@test.com`,
                    first_name: "Claim",
                    last_name: "Customer",
                })

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
                    name: `Claim Validation Store ${suffix}`,
                })

                const regionModule =
                    appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: `Claim Validation Region ${suffix}`,
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
                            title: `Claim Validation Product ${suffix}`,
                            options: [{ title: "Size", values: ["M"] }],
                            variants: [
                                {
                                    title: "Medium",
                                    sku: `CV-${suffix}`,
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
                const localSuffix = `_cv_${Date.now()}_${++prereqCounter}`

                const sl = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `CV-loc${localSuffix}` },
                        sellerHeaders,
                    )
                ).data.stock_location

                await api.post(
                    `/vendor/stock-locations/${sl.id}/fulfillment-sets`,
                    { name: `CV-fs${localSuffix}`, type: "shipping" },
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
                        name: `CV-sz${localSuffix}`,
                        geo_zones: [{ type: "country", country_code: "us" }],
                    },
                    sellerHeaders,
                )
                const serviceZone =
                    serviceZoneResp.data.fulfillment_set.service_zones.find(
                        (z: { name: string }) =>
                            z.name === `CV-sz${localSuffix}`,
                    )

                const shippingProfile = (
                    await api.post(
                        `/vendor/shipping-profiles`,
                        { name: `CV-sp${localSuffix}`, type: "default" },
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
                        name: `CV-out${localSuffix}`,
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

            const seedClaim = async () => {
                // Create and pay an order, then begin a claim against it.
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

                // Begin a claim — empty by default (no inbound items, no
                // location). Each test then mutates state as needed.
                const claim = (
                    await api.post(
                        `/admin/claims`,
                        { order_id: order.id, type: "refund" },
                        adminHeaders,
                    )
                ).data.claim

                return { order, claim }
            }

            // FR-BUG-9 — POST /admin/claims/:id/request rejects when no
            // return location.
            //
            // Backend path is implemented (`requireClaimConfirmationValid`
            // location_id branch) but the integration coverage requires
            // a fulfilled+delivered order so the inbound-items add call
            // accepts the line. Deferred as a follow-up; UI smoke covers
            // the surface manually for now.

            describe("FR-BUG-8 — POST /admin/claims/:id/request rejects empty inbound items", () => {
                it("rejects with 400 + CLAIM_REQUIRES_INBOUND_ITEMS when no inbound items added", async () => {
                    const { claim } = await seedClaim()

                    const response = await api
                        .post(
                            `/admin/claims/${claim.id}/request`,
                            {},
                            adminHeaders,
                        )
                        .catch((err) => err.response)

                    expect(response.status).toEqual(400)
                    expect(response.data.code).toEqual(
                        "CLAIM_REQUIRES_INBOUND_ITEMS",
                    )
                })
            })
        })
    },
})
