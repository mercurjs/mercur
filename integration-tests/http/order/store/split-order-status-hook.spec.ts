import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import {
    ContainerRegistrationKeys,
    Modules,
    OrderStatus,
} from "@medusajs/framework/utils"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import {
    completeCartWithSplitOrdersWorkflow,
    SetOrderStatusHookResult,
} from "@mercurjs/core/workflows"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
    adminHeaders,
    createAdminUser,
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { seedSellerOfferWithShipping } from "../../../helpers/split-order-checkout"

jest.setTimeout(180000)

// A workflow hook accepts a single handler, so it is registered once and each
// test swaps the result it hands back.
let hookResult: ((sellerIds: string[]) => SetOrderStatusHookResult) | null = null

completeCartWithSplitOrdersWorkflow.hooks.setOrderStatus(({ cart }) => {
    const sellerIds = Array.from(
        new Set(
            (cart.items ?? [])
                .map((item: { offer?: { seller_id?: string } }) => item.offer?.seller_id)
                .filter((id): id is string => typeof id === "string")
        )
    )
    return new StepResponse(hookResult ? hookResult(sellerIds) : undefined)
})

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Store - split order initial status hook", () => {
            let appContainer: MedusaContainer
            let storeHeaders: { headers: Record<string, string> }
            let customerEmail: string
            let region: { id: string }
            let salesChannel: { id: string }
            let sellerA: Awaited<ReturnType<typeof seedSellerOfferWithShipping>>
            let sellerB: Awaited<ReturnType<typeof seedSellerOfferWithShipping>>

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                hookResult = null
                await createAdminUser(dbConnection, adminHeaders, appContainer)

                const customerResult = await createCustomerUser(appContainer, {
                    email: "statushookbuyer@test.com",
                    first_name: "Status",
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
                    .createSalesChannels({ name: "Status Hook Channel" })

                region = await appContainer
                    .resolve<IRegionModuleService>(Modules.REGION)
                    .createRegions({
                        name: "Status Hook Region",
                        currency_code: "usd",
                        countries: ["us"],
                    })

                await appContainer.resolve(ContainerRegistrationKeys.LINK).create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
                })

                sellerA = await seedSellerOfferWithShipping({
                    container: appContainer,
                    api,
                    salesChannelId: salesChannel.id,
                    email: "status-hook-a@test.com",
                    name: "StatusHookA",
                    stocked: 10,
                    offerPrice: 1000,
                })
                sellerB = await seedSellerOfferWithShipping({
                    container: appContainer,
                    api,
                    salesChannelId: salesChannel.id,
                    email: "status-hook-b@test.com",
                    name: "StatusHookB",
                    stocked: 10,
                    offerPrice: 2000,
                })
            })

            const checkout = async (): Promise<Record<string, string>> => {
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

                for (const offerId of [sellerA.offer.id, sellerB.offer.id]) {
                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        { offer_id: offerId, quantity: 1 },
                        storeHeaders
                    )
                }

                const address = {
                    first_name: "Buyer",
                    last_name: "Test",
                    address_1: "123 Main St",
                    city: "New York",
                    country_code: "us",
                    postal_code: "10001",
                }
                await api.post(
                    `/store/carts/${cart.id}`,
                    {
                        email: customerEmail,
                        shipping_address: address,
                        billing_address: address,
                    },
                    storeHeaders
                )

                const options = Object.values(
                    (
                        await api.get(
                            `/store/shipping-options?cart_id=${cart.id}`,
                            storeHeaders
                        )
                    ).data.shipping_options as Record<string, { id: string }[]>
                ).flat()
                for (const option of options) {
                    await api.post(
                        `/store/carts/${cart.id}/shipping-methods`,
                        { option_id: option.id },
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

                const orderGroupId = (
                    await api.post(`/store/carts/${cart.id}/complete`, {}, storeHeaders)
                ).data.order_group.id

                const { data } = await appContainer
                    .resolve(ContainerRegistrationKeys.QUERY)
                    .graph({
                        entity: "order_group",
                        filters: { id: orderGroupId },
                        fields: ["orders.id"],
                    })
                const groupOrderIds = new Set(
                    (data[0] as { orders: { id: string }[] }).orders.map((o) => o.id)
                )
                expect(groupOrderIds.size).toBe(2)

                const statusBySeller: Record<string, string> = {}
                for (const seller of [sellerA, sellerB]) {
                    const orders = (
                        await api.get(`/vendor/orders?fields=id,status`, seller.headers)
                    ).data.orders as { id: string; status: string }[]
                    const order = orders.find((o) => groupOrderIds.has(o.id))
                    statusBySeller[seller.sellerId] = order!.status
                }
                return statusBySeller
            }

            it("keeps every order pending when the handler returns nothing", async () => {
                const statuses = await checkout()

                expect(statuses).toEqual({
                    [sellerA.sellerId]: OrderStatus.PENDING,
                    [sellerB.sellerId]: OrderStatus.PENDING,
                })
            })

            it("applies a single status to every order", async () => {
                hookResult = () => ({ status: OrderStatus.REQUIRES_ACTION })

                const statuses = await checkout()

                expect(statuses).toEqual({
                    [sellerA.sellerId]: OrderStatus.REQUIRES_ACTION,
                    [sellerB.sellerId]: OrderStatus.REQUIRES_ACTION,
                })
            })

            it("applies a per-seller status and falls back to pending for other sellers", async () => {
                hookResult = (sellerIds) => {
                    expect(sellerIds).toEqual(
                        expect.arrayContaining([sellerA.sellerId, sellerB.sellerId])
                    )
                    return {
                        status_by_seller_id: {
                            [sellerA.sellerId]: OrderStatus.REQUIRES_ACTION,
                        },
                    }
                }

                const statuses = await checkout()

                expect(statuses).toEqual({
                    [sellerA.sellerId]: OrderStatus.REQUIRES_ACTION,
                    [sellerB.sellerId]: OrderStatus.PENDING,
                })
            })
        })
    },
})
