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
 * Issue #1387 — after the 2.3.0 cutover, split orders no longer carry an
 * `order ↔ payment_collection` link; the shared payment collection stays on
 * the cart (`order → cart → payment_collection`). Vendor order reads must
 * surface that collection under `payment_collections` and recompute
 * `payment_status`, otherwise the badge stays `not_paid` even though checkout
 * authorized the payment.
 */
medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Order payment status (cart payment collection)", () => {
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
                    email: "paymentbuyer@test.com",
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
                    name: "Payment Channel",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(
                    Modules.REGION
                )
                region = await regionModule.createRegions({
                    name: "Payment Region",
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
                    email: "payment-seller@test.com",
                    name: "PaymentS1",
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

            it("GET /vendor/orders/:id surfaces the cart payment collection and an authorized payment_status", async () => {
                const order = await checkout()

                const { data } = await api.get(
                    `/vendor/orders/${order.id}`,
                    sellerSeed.headers
                )

                expect(data.order.payment_collections).toHaveLength(1)
                expect(data.order.payment_collections[0].amount).toBeGreaterThan(
                    0
                )
                expect(["authorized", "captured"]).toContain(
                    data.order.payment_status
                )
                // The shared cart must not leak onto the response.
                expect(data.order.cart).toBeUndefined()
            })

            it("GET /vendor/orders list surfaces payment_collections and payment_status", async () => {
                const order = await checkout()

                const { data } = await api.get(
                    `/vendor/orders`,
                    sellerSeed.headers
                )

                const listed = data.orders.find((o: any) => o.id === order.id)
                expect(listed).toBeDefined()
                expect(listed.payment_collections).toHaveLength(1)
                expect(["authorized", "captured"]).toContain(
                    listed.payment_status
                )
            })
        })
    },
})
