import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import {
    completeSplitOrderCheckout,
    seedSellerOfferWithShipping,
} from "../../../helpers/split-order-checkout"

jest.setTimeout(120000)

/**
 * Issue #1419 — the storefront reads the same split orders through the stock
 * `/store/orders(/:id)` routes, which also missed the #1387 fix and reported
 * `not_paid` for a fully authorized checkout.
 */
medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Store - Order payment status (cart payment collection)", () => {
            let appContainer: MedusaContainer
            let sellerSeed: any
            let storeHeaders: any
            let customerEmail: string
            let region: any
            let salesChannel: any

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const customerResult = await createCustomerUser(appContainer, {
                    email: "storepaymentbuyer@test.com",
                    first_name: "Payment",
                    last_name: "Buyer",
                })
                customerEmail = customerResult.customer.email!
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
                    name: "Store Payment Channel",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(
                    Modules.REGION
                )
                region = await regionModule.createRegions({
                    name: "Store Payment Region",
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

                sellerSeed = await seedSellerOfferWithShipping({
                    container: appContainer,
                    api,
                    salesChannelId: salesChannel.id,
                    email: "store-payment-seller@test.com",
                    name: "StorePaymentS1",
                    stocked: 20,
                    offerPrice: 2500,
                })
            })

            const checkout = () =>
                completeSplitOrderCheckout({
                    container: appContainer,
                    api,
                    storeHeaders,
                    regionId: region.id,
                    salesChannelId: salesChannel.id,
                    offerId: sellerSeed.offer.id,
                    email: customerEmail,
                })

            it("GET /store/orders/:id surfaces the cart payment collection and an authorized payment_status", async () => {
                const order = await checkout()

                const { data } = await api.get(
                    `/store/orders/${order.id}`,
                    storeHeaders
                )

                expect(data.order.payment_collections).toHaveLength(1)
                expect(data.order.payment_collections[0].amount).toBeGreaterThan(
                    0
                )
                expect(["authorized", "captured"]).toContain(
                    data.order.payment_status
                )
                expect(data.order.cart).toBeUndefined()
            })

            it("GET /store/orders list surfaces payment_collections and payment_status", async () => {
                const order = await checkout()

                const { data } = await api.get(`/store/orders`, storeHeaders)

                const listed = data.orders.find((o: any) => o.id === order.id)
                expect(listed).toBeDefined()
                expect(listed.payment_collections).toHaveLength(1)
                expect(["authorized", "captured"]).toContain(
                    listed.payment_status
                )
                expect(listed.cart).toBeUndefined()
            })
        })
    },
})
