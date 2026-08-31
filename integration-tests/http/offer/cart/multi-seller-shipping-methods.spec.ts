import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"

import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import { createVendorProduct } from "../../../helpers/create-product"
import { createSellerUser } from "../../../helpers/create-seller-user"

const approveSeller = async (container: MedusaContainer, sellerId: string) => {
    const sellerModule: any = container.resolve(MercurModules.SELLER)
    await sellerModule.updateSellers({ id: sellerId, status: SellerStatus.OPEN })
}

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Cart - multi-seller shipping methods", () => {
            let appContainer: MedusaContainer
            let storeHeaders: any
            let region: any
            let salesChannel: any
            let counter = 0

            const seedSeller = async (opts: {
                email: string
                name: string
                offerPrice: number
                existingProduct?: any
            }) => {
                const result = await createSellerUser(appContainer, {
                    email: opts.email,
                    name: opts.name,
                })
                await approveSeller(appContainer, (result.seller as any).id)
                const headers = result.headers
                const suffix = `_${opts.name}_${Date.now()}_${++counter}`

                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `Warehouse${suffix}` },
                        headers
                    )
                ).data.stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    { name: `FS${suffix}`, type: "shipping" },
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
                            name: `SZ${suffix}`,
                            geo_zones: [{ type: "country", country_code: "us" }],
                        },
                        headers
                    )
                ).data.fulfillment_set.service_zones.find(
                    (z: any) => z.name === `SZ${suffix}`
                )
                const shippingProfile = (
                    await api.post(
                        `/vendor/shipping-profiles`,
                        { name: `SP${suffix}`, type: "default" },
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

                const shippingOption = (
                    await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: `Ship${suffix}`,
                            service_zone_id: serviceZone.id,
                            shipping_profile_id: shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "flat",
                            type: {
                                label: "Standard",
                                description: "Standard shipping",
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
                ).data.shipping_option

                const product =
                    opts.existingProduct ??
                    (await createVendorProduct(api, headers, {
                        title: `Prod${suffix}`,
                        sku: `V${suffix}`,
                    }))

                if (!opts.existingProduct) {
                    await api.post(
                        `/vendor/sales-channels/${salesChannel.id}/products`,
                        { add: [product.id] },
                        headers
                    )
                }

                const offer = (
                    await api.post(
                        `/vendor/offers`,
                        {
                            sku: `OF${suffix}`,
                            variant_id: product.variants[0].id,
                            shipping_profile_id: shippingProfile.id,
                            inventory_items: [
                                {
                                    title: `Inv${suffix}`,
                                    required_quantity: 1,
                                    stock_levels: [
                                        {
                                            location_id: stockLocation.id,
                                            stocked_quantity: 20,
                                        },
                                    ],
                                },
                            ],
                            prices: [
                                { amount: opts.offerPrice, currency_code: "usd" },
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
                    shippingProfile,
                    shippingOptionId: shippingOption.id as string,
                }
            }

            const addShippingMethod = async (
                cartId: string,
                optionId: string
            ) => {
                const res = await api.post(
                    `/store/carts/${cartId}/shipping-methods`,
                    { option_id: optionId },
                    storeHeaders
                )
                return res.data.cart.shipping_methods as any[]
            }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const customerResult = await createCustomerUser(appContainer, {
                    email: "multisellerbuyer@test.com",
                    first_name: "Multi",
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
                    name: "Default Store",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(
                    Modules.REGION
                )
                region = await regionModule.createRegions({
                    name: "Test Region",
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

            it("keeps both sellers' shipping methods when a line's product is profile-linked to another seller", async () => {
                // Seller A first-offers the shared product, so the one-to-one
                // product↔shipping-profile link points at A's profile.
                const sellerA = await seedSeller({
                    email: "seller-a@test.com",
                    name: "SellerA",
                    offerPrice: 3000,
                })

                // Seller B undercuts A on that same product.
                const sellerB = await seedSeller({
                    email: "seller-b@test.com",
                    name: "SellerB",
                    offerPrice: 1000,
                    existingProduct: sellerA.product,
                })

                // A second product, sold only by A, so the cart spans two sellers.
                const sellerAOther = await seedSeller({
                    email: "seller-a-other@test.com",
                    name: "SellerAOther",
                    offerPrice: 2000,
                })

                const cart = (
                    await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                            email: "multisellerbuyer@test.com",
                            shipping_address: {
                                first_name: "Multi",
                                last_name: "Buyer",
                                address_1: "123 Main St",
                                city: "New York",
                                country_code: "us",
                                postal_code: "10001",
                            },
                            billing_address: {
                                first_name: "Multi",
                                last_name: "Buyer",
                                address_1: "123 Main St",
                                city: "New York",
                                country_code: "us",
                                postal_code: "10001",
                            },
                        },
                        storeHeaders
                    )
                ).data.cart

                await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    { offer_id: sellerB.offer.id, quantity: 1 },
                    storeHeaders
                )
                await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    { offer_id: sellerAOther.offer.id, quantity: 1 },
                    storeHeaders
                )

                const afterFirst = await addShippingMethod(
                    cart.id,
                    sellerB.shippingOptionId
                )
                expect(afterFirst).toHaveLength(1)

                // Adding the second seller's method triggers the refresh whose
                // orphan-profile cleanup used to delete B's method, because the
                // shared product is profile-linked to seller A.
                const afterSecond = await addShippingMethod(
                    cart.id,
                    sellerAOther.shippingOptionId
                )

                expect(afterSecond).toHaveLength(2)
                expect(
                    afterSecond.map((m) => m.shipping_option_id).sort()
                ).toEqual(
                    [
                        sellerB.shippingOptionId,
                        sellerAOther.shippingOptionId,
                    ].sort()
                )

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

                expect(completeResp.status).toEqual(200)
                expect(completeResp.data.type).toEqual("order_group")
            })
        })
    },
})
