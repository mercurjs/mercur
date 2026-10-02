import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { markOrderFulfillmentAsDeliveredWorkflow } from "@mercurjs/core/workflows"
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

// A workflow hook accepts a single handler, so it is registered once and each
// test reads what it collected.
const delivered: { order_id: string; fulfillment_id: string }[] = []

markOrderFulfillmentAsDeliveredWorkflow.hooks.fulfillmentDelivered((input) => {
    delivered.push(input)
})

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - fulfillmentDelivered hook", () => {
            let appContainer: MedusaContainer
            let sellerSeed: Awaited<ReturnType<typeof seedSellerOfferWithShipping>>
            let storeHeaders: { headers: Record<string, string> }
            let customerEmail: string
            let region: { id: string }
            let salesChannel: { id: string }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                delivered.length = 0

                const customerResult = await createCustomerUser(appContainer, {
                    email: "deliveredbuyer@test.com",
                    first_name: "Delivered",
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

                salesChannel = await appContainer
                    .resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
                    .createSalesChannels({ name: "Delivered Hook Channel" })

                region = await appContainer
                    .resolve<IRegionModuleService>(Modules.REGION)
                    .createRegions({
                        name: "Delivered Hook Region",
                        currency_code: "usd",
                        countries: ["us"],
                    })

                await appContainer.resolve(ContainerRegistrationKeys.LINK).create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
                })

                sellerSeed = await seedSellerOfferWithShipping({
                    container: appContainer,
                    api,
                    salesChannelId: salesChannel.id,
                    email: "delivered-hook@test.com",
                    name: "DeliveredHook",
                    stocked: 10,
                    offerPrice: 1000,
                })
            })

            it("hands the order and fulfillment ids to the hook when a vendor marks a fulfillment delivered", async () => {
                const order = await completeSplitOrderCheckout({
                    container: appContainer,
                    api,
                    storeHeaders,
                    regionId: region.id,
                    salesChannelId: salesChannel.id,
                    offerId: sellerSeed.offer.id,
                    email: customerEmail,
                })

                const items: { id: string; quantity: number }[] = (
                    await api.get(
                        `/vendor/orders/${order.id}?fields=*items`,
                        sellerSeed.headers
                    )
                ).data.order.items
                const [stockLocation] = (
                    await api.get(`/vendor/stock-locations`, sellerSeed.headers)
                ).data.stock_locations

                const fulfillment = (
                    await api.post(
                        `/vendor/orders/${order.id}/fulfillments`,
                        {
                            items: items.map((item) => ({
                                id: item.id,
                                quantity: item.quantity,
                            })),
                            requires_shipping: true,
                            location_id: stockLocation.id,
                        },
                        sellerSeed.headers
                    )
                ).data.fulfillment

                expect(delivered).toEqual([])

                const response = await api.post(
                    `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/mark-as-delivered`,
                    {},
                    sellerSeed.headers
                )

                expect(response.status).toEqual(200)
                expect(delivered).toEqual([
                    { order_id: order.id, fulfillment_id: fulfillment.id },
                ])
            })
        })
    },
})
