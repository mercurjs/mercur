import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createCustomerUser } from "../../helpers/create-customer-user"
import {
    adminHeaders,
    createAdminUser,
    generatePublishableKey,
    generateStoreHeaders,
} from "../../helpers/create-admin-user"
import {
    completeSplitOrderGroupCheckout,
    seedSellerOfferWithShipping,
} from "../../helpers/split-order-checkout"

jest.setTimeout(180000)

const SELLER_A_TOTAL = 3000
const SELLER_B_TOTAL = 4500

/**
 * Issue #1596 — the orders of a cart share its payment until that payment is
 * captured. The capture splits it: every order gets a payment collection of
 * its own, linked to the order, so Medusa's stock refund and cancel routes
 * work on it.
 */
medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Split order payments (split at capture)", () => {
            let appContainer: MedusaContainer
            let sellerA: any
            let sellerB: any
            let storeHeaders: any
            let customerEmail: string
            let region: any
            let salesChannel: any

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)

                const customerResult = await createCustomerUser(appContainer, {
                    email: "splitpaymentbuyer@test.com",
                    first_name: "Split",
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
                    name: "Split Payment Channel",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(
                    Modules.REGION
                )
                region = await regionModule.createRegions({
                    name: "Split Payment Region",
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

                sellerA = await seedSellerOfferWithShipping({
                    container: appContainer,
                    api,
                    salesChannelId: salesChannel.id,
                    email: "split-payment-a@test.com",
                    name: "SplitPayA",
                    stocked: 20,
                    offerPrice: 2500,
                })
                sellerB = await seedSellerOfferWithShipping({
                    container: appContainer,
                    api,
                    salesChannelId: salesChannel.id,
                    email: "split-payment-b@test.com",
                    name: "SplitPayB",
                    stocked: 20,
                    offerPrice: 4000,
                })
            })

            const query = () =>
                appContainer.resolve(ContainerRegistrationKeys.QUERY)

            const getOrder = async (orderId: string) => {
                const {
                    data: [order],
                } = await query().graph({
                    entity: "order",
                    filters: { id: orderId },
                    fields: [
                        "id",
                        "status",
                        "total",
                        "summary",
                        "transactions.reference",
                        "transactions.amount",
                        "payment_collections.id",
                        "payment_collections.amount",
                        "payment_collections.status",
                        "payment_collections.payments.id",
                        "payment_collections.payments.provider_id",
                        "payment_collections.payments.amount",
                        "payment_collections.payments.canceled_at",
                        "payment_collections.payments.captured_at",
                        "payment_collections.payments.captures.amount",
                        "payment_collections.payments.refunds.amount",
                        "cart.payment_collection.status",
                        "cart.payment_collection.payments.id",
                        "cart.payment_collection.payments.canceled_at",
                        "cart.payment_collection.payments.captured_at",
                        "cart.payment_collection.payments.captures.amount",
                        "cart.payment_collection.payments.refunds.amount",
                    ],
                })
                return order as any
            }

            const orderPayment = async (orderId: string) =>
                (await getOrder(orderId)).payment_collections[0]?.payments[0]

            const cartPayment = async (orderId: string) =>
                (await getOrder(orderId)).cart.payment_collection.payments[0]

            const amounts = (movements: any[]) =>
                (movements ?? []).map((m) => Number(m.amount))

            const transactionsOf = (order: any, reference: string) =>
                order.transactions
                    .filter((t: any) => t.reference === reference)
                    .map((t: any) => Number(t.amount))

            // The split and the void run from an event subscriber, after the
            // request returns.
            const eventually = async (assertion: () => Promise<void>) => {
                const deadline = Date.now() + 15000
                for (;;) {
                    try {
                        return await assertion()
                    } catch (error) {
                        if (Date.now() > deadline) {
                            throw error
                        }
                        await new Promise((r) => setTimeout(r, 250))
                    }
                }
            }

            const checkout = async (offerIds: string[]) => {
                const orders = await completeSplitOrderGroupCheckout({
                    container: appContainer,
                    api,
                    storeHeaders,
                    regionId: region.id,
                    salesChannelId: salesChannel.id,
                    offerIds,
                    email: customerEmail,
                })

                const { data: links } = await query().graph({
                    entity: "order_seller",
                    filters: { order_id: orders.map((o) => o.id) },
                    fields: ["order_id", "seller_id"],
                })
                const orderIdOf = (sellerId: string) =>
                    links.find((l: any) => l.seller_id === sellerId)
                        ?.order_id as string

                return {
                    orderA: orderIdOf(sellerA.sellerId),
                    orderB: orderIdOf(sellerB.sellerId),
                }
            }

            const checkoutBothSellers = () =>
                checkout([sellerA.offer.id, sellerB.offer.id])

            const capture = (paymentId: string) =>
                api.post(
                    `/admin/payments/${paymentId}/capture`,
                    {},
                    adminHeaders
                )

            const captureEverything = async (orderA: string, orderB: string) => {
                await capture((await cartPayment(orderA)).id)
                await eventually(async () => {
                    expect(
                        (await orderPayment(orderA))?.captured_at
                    ).toBeTruthy()
                    expect(
                        (await orderPayment(orderB))?.captured_at
                    ).toBeTruthy()
                })
            }

            describe("before capture", () => {
                it("keeps the orders on the cart's shared payment collection", async () => {
                    const { orderA, orderB } = await checkoutBothSellers()

                    expect((await getOrder(orderA)).payment_collections).toEqual(
                        []
                    )
                    expect((await getOrder(orderB)).payment_collections).toEqual(
                        []
                    )

                    const { data } = await api.get(
                        `/admin/orders/${orderA}`,
                        adminHeaders
                    )

                    expect(data.order.payment_collections).toHaveLength(1)
                    expect(
                        Number(data.order.payment_collections[0].amount)
                    ).toEqual(SELLER_A_TOTAL + SELLER_B_TOTAL)
                    expect(data.order.payment_status).toEqual("authorized")
                })
            })

            describe("capture", () => {
                it("gives every order its own captured payment collection", async () => {
                    const { orderA, orderB } = await checkoutBothSellers()

                    await captureEverything(orderA, orderB)

                    const a = await getOrder(orderA)
                    const b = await getOrder(orderB)

                    expect(a.payment_collections).toHaveLength(1)
                    expect(b.payment_collections).toHaveLength(1)
                    expect(a.payment_collections[0].id).not.toEqual(
                        b.payment_collections[0].id
                    )
                    expect(Number(a.payment_collections[0].amount)).toEqual(
                        SELLER_A_TOTAL
                    )
                    expect(Number(b.payment_collections[0].amount)).toEqual(
                        SELLER_B_TOTAL
                    )
                    expect(
                        a.payment_collections[0].payments[0].provider_id
                    ).toEqual("pp_system_default")

                    expect(transactionsOf(a, "capture")).toEqual([
                        SELLER_A_TOTAL,
                    ])
                    expect(transactionsOf(b, "capture")).toEqual([
                        SELLER_B_TOTAL,
                    ])
                    expect(Number(a.summary.pending_difference)).toEqual(0)
                    expect(Number(b.summary.pending_difference)).toEqual(0)
                })

                it("exposes the order's own payment collection on the admin order", async () => {
                    const { orderA, orderB } = await checkoutBothSellers()
                    await captureEverything(orderA, orderB)

                    const { data } = await api.get(
                        `/admin/orders/${orderA}`,
                        adminHeaders
                    )

                    expect(data.order.payment_collections).toHaveLength(1)
                    expect(
                        Number(data.order.payment_collections[0].amount)
                    ).toEqual(SELLER_A_TOTAL)
                    expect(data.order.payment_status).toEqual("captured")
                })

                it("does not split the same capture twice", async () => {
                    const { orderA, orderB } = await checkoutBothSellers()
                    await captureEverything(orderA, orderB)

                    await capture((await cartPayment(orderA)).id).catch(
                        (e) => e.response
                    )
                    await new Promise((r) => setTimeout(r, 1500))

                    const a = await getOrder(orderA)
                    expect(a.payment_collections).toHaveLength(1)
                    expect(transactionsOf(a, "capture")).toEqual([
                        SELLER_A_TOTAL,
                    ])
                    expect(amounts((await cartPayment(orderA)).refunds)).toEqual(
                        []
                    )
                })
            })

            describe("refund", () => {
                it("refunds an order's payment through the stock admin route", async () => {
                    const { orderA, orderB } = await checkoutBothSellers()
                    await captureEverything(orderA, orderB)

                    const response = await api.post(
                        `/admin/payments/${(await orderPayment(orderA)).id}/refund`,
                        { amount: 1000 },
                        adminHeaders
                    )
                    expect(response.status).toEqual(200)

                    const a = await getOrder(orderA)
                    const b = await getOrder(orderB)

                    expect(transactionsOf(a, "refund")).toEqual([-1000])
                    expect(transactionsOf(b, "refund")).toEqual([])
                    expect(Number(a.summary.pending_difference)).toEqual(0)
                })

                it("cannot refund more than the order's share", async () => {
                    const { orderA, orderB } = await checkoutBothSellers()
                    await captureEverything(orderA, orderB)

                    const response = await api
                        .post(
                            `/admin/payments/${(await orderPayment(orderA)).id}/refund`,
                            { amount: SELLER_A_TOTAL + 500 },
                            adminHeaders
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                    expect((await orderPayment(orderA)).refunds).toHaveLength(0)
                })

                it("lets a seller refund only their own order's payment", async () => {
                    const { orderA, orderB } = await checkoutBothSellers()
                    await captureEverything(orderA, orderB)

                    const own = await api.post(
                        `/vendor/payments/${(await orderPayment(orderA)).id}/refund`,
                        { amount: 500 },
                        sellerA.headers
                    )
                    expect(own.status).toEqual(200)
                    expect(
                        transactionsOf(await getOrder(orderA), "refund")
                    ).toEqual([-500])

                    const foreign = await api
                        .post(
                            `/vendor/payments/${(await orderPayment(orderB)).id}/refund`,
                            { amount: 500 },
                            sellerA.headers
                        )
                        .catch((e) => e.response)
                    expect(foreign.status).toEqual(404)
                })
            })

            describe("cancel", () => {
                it("refunds only the canceled order after capture", async () => {
                    const { orderA, orderB } = await checkoutBothSellers()
                    await captureEverything(orderA, orderB)

                    const response = await api.post(
                        `/vendor/orders/${orderA}/cancel`,
                        {},
                        sellerA.headers
                    )
                    expect(response.status).toEqual(200)

                    const a = await getOrder(orderA)

                    expect(a.status).toEqual("canceled")
                    expect(transactionsOf(a, "refund")).toEqual([
                        -SELLER_A_TOTAL,
                    ])
                    expect(
                        amounts((await orderPayment(orderA)).refunds)
                    ).toEqual([SELLER_A_TOTAL])
                    expect(
                        amounts((await orderPayment(orderB)).refunds)
                    ).toEqual([])
                })

                it("keeps the authorization for the remaining order, then refunds the canceled share on capture", async () => {
                    const { orderA, orderB } = await checkoutBothSellers()

                    await api.post(
                        `/admin/orders/${orderA}/cancel`,
                        {},
                        adminHeaders
                    )

                    expect((await cartPayment(orderA)).canceled_at).toBeNull()

                    await capture((await cartPayment(orderA)).id)

                    await eventually(async () => {
                        expect(
                            (await orderPayment(orderB))?.captured_at
                        ).toBeTruthy()
                        expect(
                            amounts((await cartPayment(orderA)).refunds)
                        ).toEqual([SELLER_A_TOTAL])
                    })

                    const a = await getOrder(orderA)
                    expect(a.payment_collections).toEqual([])
                    expect(transactionsOf(a, "capture")).toEqual([])
                    expect(
                        transactionsOf(await getOrder(orderB), "capture")
                    ).toEqual([SELLER_B_TOTAL])
                })

                it("voids the cart payment once every order is canceled", async () => {
                    const { orderA, orderB } = await checkoutBothSellers()

                    await api.post(
                        `/admin/orders/${orderA}/cancel`,
                        {},
                        adminHeaders
                    )
                    await api.post(
                        `/admin/orders/${orderB}/cancel`,
                        {},
                        adminHeaders
                    )

                    await eventually(async () => {
                        const order = await getOrder(orderA)
                        expect(
                            order.cart.payment_collection.payments[0]
                                .canceled_at
                        ).toBeTruthy()
                        expect(order.cart.payment_collection.status).toEqual(
                            "canceled"
                        )
                    })
                })
            })
        })
    },
})
