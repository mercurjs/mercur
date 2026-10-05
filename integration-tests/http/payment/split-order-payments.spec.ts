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
 * Issue #1596 — the payment collection of a split order is shared and stays on
 * the cart, so Medusa's cancel / refund / capture workflows, which resolve the
 * payment through the order↔payment_collection link, never reached it.
 */
medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Split order payments (shared cart payment collection)", () => {
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

                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { data: links } = await query.graph({
                    entity: "order_seller",
                    filters: { order_id: orders.map((o) => o.id) },
                    fields: ["order_id", "seller_id"],
                })
                const orderIdOf = (sellerId: string) =>
                    links.find((l: any) => l.seller_id === sellerId)
                        ?.order_id as string

                const { data } = await api.get(
                    `/admin/orders/${orders[0].id}`,
                    adminHeaders
                )

                return {
                    orderA: orderIdOf(sellerA.sellerId),
                    orderB: orderIdOf(sellerB.sellerId),
                    paymentId: data.order.payment_collections[0].payments[0]
                        .id as string,
                }
            }

            const checkoutBothSellers = () =>
                checkout([sellerA.offer.id, sellerB.offer.id])

            const getOrder = async (orderId: string) => {
                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const {
                    data: [order],
                } = await query.graph({
                    entity: "order",
                    filters: { id: orderId },
                    fields: [
                        "id",
                        "status",
                        "total",
                        "summary",
                        "transactions.reference",
                        "transactions.amount",
                    ],
                })
                return order as any
            }

            const getPayment = async (paymentId: string) => {
                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const {
                    data: [payment],
                } = await query.graph({
                    entity: "payment",
                    filters: { id: paymentId },
                    fields: [
                        "id",
                        "canceled_at",
                        "captures.amount",
                        "refunds.amount",
                        "payment_collection.status",
                    ],
                })
                return payment as any
            }

            const transactionsOf = (order: any, reference: string) =>
                order.transactions
                    .filter((t: any) => t.reference === reference)
                    .map((t: any) => Number(t.amount))

            const capture = (paymentId: string) =>
                api.post(
                    `/admin/payments/${paymentId}/capture`,
                    {},
                    adminHeaders
                )

            describe("capture", () => {
                it("records the capture on every order of the cart", async () => {
                    const { orderA, orderB, paymentId } =
                        await checkoutBothSellers()

                    const response = await capture(paymentId)
                    expect(response.status).toEqual(200)

                    const a = await getOrder(orderA)
                    const b = await getOrder(orderB)

                    expect(transactionsOf(a, "capture")).toEqual([
                        SELLER_A_TOTAL,
                    ])
                    expect(transactionsOf(b, "capture")).toEqual([
                        SELLER_B_TOTAL,
                    ])
                    expect(Number(a.summary.pending_difference)).toEqual(0)
                    expect(Number(b.summary.pending_difference)).toEqual(0)
                    expect(Number(a.summary.paid_total)).toEqual(SELLER_A_TOTAL)
                })

                it("does not record a capture twice", async () => {
                    const { orderA, paymentId } = await checkoutBothSellers()

                    await capture(paymentId)
                    await capture(paymentId).catch((e) => e.response)

                    const a = await getOrder(orderA)
                    expect(transactionsOf(a, "capture")).toEqual([
                        SELLER_A_TOTAL,
                    ])
                })
            })

            describe("refund", () => {
                it("requires an order on a payment shared by several orders", async () => {
                    const { paymentId } = await checkoutBothSellers()
                    await capture(paymentId)

                    const response = await api
                        .post(
                            `/admin/payments/${paymentId}/refund`,
                            { amount: 1000 },
                            adminHeaders
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("attributes an admin refund to the given order only", async () => {
                    const { orderA, orderB, paymentId } =
                        await checkoutBothSellers()
                    await capture(paymentId)

                    const response = await api.post(
                        `/admin/payments/${paymentId}/refund`,
                        { amount: 1000, order_id: orderA },
                        adminHeaders
                    )
                    expect(response.status).toEqual(200)

                    const a = await getOrder(orderA)
                    const b = await getOrder(orderB)

                    expect(transactionsOf(a, "refund")).toEqual([-1000])
                    expect(transactionsOf(b, "refund")).toEqual([])
                    expect(Number(a.summary.pending_difference)).toEqual(0)
                    expect(Number(b.summary.pending_difference)).toEqual(0)
                })

                it("caps a refund at the order's share of the payment", async () => {
                    const { orderA, paymentId } = await checkoutBothSellers()
                    await capture(paymentId)

                    const response = await api
                        .post(
                            `/admin/payments/${paymentId}/refund`,
                            { amount: SELLER_A_TOTAL + 500, order_id: orderA },
                            adminHeaders
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                    expect((await getPayment(paymentId)).refunds).toHaveLength(0)
                })

                it("attributes a vendor refund to that seller's order", async () => {
                    const { orderA, orderB, paymentId } =
                        await checkoutBothSellers()
                    await capture(paymentId)

                    const response = await api.post(
                        `/vendor/payments/${paymentId}/refund`,
                        { amount: 500 },
                        sellerA.headers
                    )
                    expect(response.status).toEqual(200)

                    expect(
                        transactionsOf(await getOrder(orderA), "refund")
                    ).toEqual([-500])
                    expect(
                        transactionsOf(await getOrder(orderB), "refund")
                    ).toEqual([])

                    const overShare = await api
                        .post(
                            `/vendor/payments/${paymentId}/refund`,
                            { amount: SELLER_A_TOTAL },
                            sellerA.headers
                        )
                        .catch((e) => e.response)
                    expect(overShare.status).toEqual(400)
                })

                it("refunds a single-order cart without naming the order", async () => {
                    const { orderA, paymentId } = await checkout([
                        sellerA.offer.id,
                    ])
                    await capture(paymentId)

                    const response = await api.post(
                        `/admin/payments/${paymentId}/refund`,
                        { amount: 1000 },
                        adminHeaders
                    )
                    expect(response.status).toEqual(200)

                    expect(
                        transactionsOf(await getOrder(orderA), "refund")
                    ).toEqual([-1000])
                })
            })

            describe("cancel", () => {
                it("refunds only the canceled order's share of a captured payment", async () => {
                    const { orderA, orderB, paymentId } =
                        await checkoutBothSellers()
                    await capture(paymentId)

                    const response = await api.post(
                        `/vendor/orders/${orderA}/cancel`,
                        {},
                        sellerA.headers
                    )
                    expect(response.status).toEqual(200)

                    const a = await getOrder(orderA)
                    const b = await getOrder(orderB)
                    const payment = await getPayment(paymentId)

                    expect(a.status).toEqual("canceled")
                    expect(transactionsOf(a, "refund")).toEqual([
                        -SELLER_A_TOTAL,
                    ])
                    expect(transactionsOf(b, "refund")).toEqual([])
                    expect(
                        payment.refunds.map((r: any) => Number(r.amount))
                    ).toEqual([SELLER_A_TOTAL])
                    expect(payment.payment_collection.status).not.toEqual(
                        "canceled"
                    )
                })

                it("keeps the authorization for the remaining order and captures only its share", async () => {
                    const { orderA, orderB, paymentId } =
                        await checkoutBothSellers()

                    await api.post(
                        `/admin/orders/${orderA}/cancel`,
                        {},
                        adminHeaders
                    )

                    expect((await getPayment(paymentId)).canceled_at).toBeNull()

                    await capture(paymentId)

                    const payment = await getPayment(paymentId)
                    expect(
                        payment.captures.map((c: any) => Number(c.amount))
                    ).toEqual([SELLER_B_TOTAL])
                    expect(
                        transactionsOf(await getOrder(orderA), "capture")
                    ).toEqual([])
                    expect(
                        transactionsOf(await getOrder(orderB), "capture")
                    ).toEqual([SELLER_B_TOTAL])
                })

                it("voids the authorization once every order of the cart is canceled", async () => {
                    const { orderA, orderB, paymentId } =
                        await checkoutBothSellers()

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

                    const payment = await getPayment(paymentId)
                    expect(payment.canceled_at).toBeTruthy()
                    expect(payment.payment_collection.status).toEqual(
                        "canceled"
                    )
                })

                it("refunds a captured single-order cart in full", async () => {
                    const { orderA, paymentId } = await checkout([
                        sellerA.offer.id,
                    ])
                    await capture(paymentId)

                    await api.post(
                        `/admin/orders/${orderA}/cancel`,
                        {},
                        adminHeaders
                    )

                    const payment = await getPayment(paymentId)
                    expect(
                        payment.refunds.map((r: any) => Number(r.amount))
                    ).toEqual([SELLER_A_TOTAL])
                    expect(payment.payment_collection.status).toEqual(
                        "canceled"
                    )
                })
            })
        })
    },
})
