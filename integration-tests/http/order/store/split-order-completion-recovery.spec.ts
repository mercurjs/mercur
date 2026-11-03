import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
    adminHeaders,
    createAdminUser,
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { seedSellerOfferWithShipping } from "../../../helpers/split-order-checkout"

jest.setTimeout(180000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Store - split order completion recovery", () => {
            let appContainer: MedusaContainer
            let storeHeaders: { headers: Record<string, string> }
            let customerId: string
            let customerEmail: string
            let region: { id: string }
            let salesChannel: { id: string }
            let sellerA: Awaited<ReturnType<typeof seedSellerOfferWithShipping>>
            let sellerB: Awaited<ReturnType<typeof seedSellerOfferWithShipping>>

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)

                const customerResult = await createCustomerUser(appContainer, {
                    email: "recoverybuyer@test.com",
                    first_name: "Recovery",
                    last_name: "Buyer",
                })
                customerId = customerResult.customer.id
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
                    .createSalesChannels({ name: "Recovery Channel" })

                region = await appContainer
                    .resolve<IRegionModuleService>(Modules.REGION)
                    .createRegions({
                        name: "Recovery Region",
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
                    email: "recovery-a@test.com",
                    name: "RecoveryA",
                    stocked: 10,
                    offerPrice: 1000,
                })
                sellerB = await seedSellerOfferWithShipping({
                    container: appContainer,
                    api,
                    salesChannelId: salesChannel.id,
                    email: "recovery-b@test.com",
                    name: "RecoveryB",
                    stocked: 10,
                    offerPrice: 2000,
                })
            })

            const prepareCart = async (): Promise<string> => {
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

                return cart.id
            }

            const completeCart = async (cartId: string): Promise<string> =>
                (await api.post(`/store/carts/${cartId}/complete`, {}, storeHeaders))
                    .data.order_group.id

            const getCartState = async (cartId: string) => {
                const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
                const [
                    { data: orderGroups },
                    { data: orderCarts },
                    { data: orders },
                    { data: carts },
                ] = await Promise.all([
                    query.graph({
                        entity: "order_group",
                        fields: ["id", "orders.id"],
                        filters: { cart_id: cartId },
                    }),
                    query.graph({
                        entity: "order_cart",
                        fields: ["order_id"],
                        filters: { cart_id: cartId },
                    }),
                    query.graph({
                        entity: "order",
                        fields: ["id"],
                        filters: { customer_id: customerId },
                    }),
                    query.graph({
                        entity: "cart",
                        fields: ["completed_at"],
                        filters: { id: cartId },
                    }),
                ])

                return {
                    orderGroups: orderGroups as { id: string; orders: { id: string }[] }[],
                    orderCartOrderIds: orderCarts.map((link) => link.order_id),
                    customerOrderIds: orders.map((order) => order.id),
                    completedAt: carts[0].completed_at,
                }
            }

            it("reuses the order group left by a completion that stopped before creating orders", async () => {
                const cartId = await prepareCart()

                const leftoverGroup = await appContainer
                    .resolve(MercurModules.SELLER)
                    .createOrderGroups({ cart_id: cartId, customer_id: customerId })

                const orderGroupId = await completeCart(cartId)

                expect(orderGroupId).toBe(leftoverGroup.id)

                const state = await getCartState(cartId)
                expect(state.orderGroups).toHaveLength(1)
                expect(state.orderGroups[0].orders).toHaveLength(2)
                expect(state.orderCartOrderIds).toHaveLength(2)
                expect(state.customerOrderIds.sort()).toEqual(
                    state.orderGroups[0].orders.map((order) => order.id).sort()
                )
                expect(state.completedAt).toBeTruthy()
            })

            it("returns the same order group without creating orders when a completed cart is completed again", async () => {
                const cartId = await prepareCart()

                const firstOrderGroupId = await completeCart(cartId)
                const before = await getCartState(cartId)

                const secondOrderGroupId = await completeCart(cartId)
                const after = await getCartState(cartId)

                expect(secondOrderGroupId).toBe(firstOrderGroupId)
                expect(after.orderGroups).toHaveLength(1)
                expect(after.customerOrderIds.sort()).toEqual(
                    before.customerOrderIds.sort()
                )
                expect(after.customerOrderIds).toHaveLength(2)
            })
        })
    },
})
