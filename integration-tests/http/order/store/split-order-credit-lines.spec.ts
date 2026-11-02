import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
    adminHeaders,
    createAdminUser,
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import {
    completeSplitOrderGroupCheckout,
    seedSellerOfferWithShipping,
} from "../../../helpers/split-order-checkout"

jest.setTimeout(180000)

const SELLER_A_TOTAL = 3000
const SELLER_B_TOTAL = 4500

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Split order credit lines", () => {
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
                    email: "creditbuyer@test.com",
                    first_name: "Credit",
                    last_name: "Buyer",
                })
                customerEmail = customerResult.customer.email!
                const apiKey = await generatePublishableKey(appContainer)
                storeHeaders = {
                    headers: {
                        ...generateStoreHeaders({ publishableKey: apiKey }).headers,
                        ...customerResult.headers.headers,
                    },
                }

                salesChannel = await appContainer
                    .resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
                    .createSalesChannels({ name: "Credit Channel" })

                region = await appContainer
                    .resolve<IRegionModuleService>(Modules.REGION)
                    .createRegions({
                        name: "Credit Region",
                        currency_code: "usd",
                        countries: ["us"],
                    })

                await appContainer
                    .resolve(ContainerRegistrationKeys.LINK)
                    .create({
                        [Modules.REGION]: { region_id: region.id },
                        [Modules.PAYMENT]: {
                            payment_provider_id: "pp_system_default",
                        },
                    })

                sellerA = await seedSellerOfferWithShipping({
                    container: appContainer,
                    api,
                    salesChannelId: salesChannel.id,
                    email: "credit-a@test.com",
                    name: "CreditA",
                    stocked: 20,
                    offerPrice: 2500,
                })
                sellerB = await seedSellerOfferWithShipping({
                    container: appContainer,
                    api,
                    salesChannelId: salesChannel.id,
                    email: "credit-b@test.com",
                    name: "CreditB",
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
                        "total",
                        "credit_line_total",
                        "summary",
                        "credit_lines.amount",
                        "credit_lines.reference",
                        "credit_lines.reference_id",
                        "credit_lines.metadata",
                        "payment_collections.payments.captures.amount",
                        "cart.total",
                        "cart.credit_lines.id",
                        "cart.payment_collection.amount",
                        "cart.payment_collection.payments.id",
                    ],
                })
                return order as any
            }

            const checkout = async (
                creditLines: { amount: number; reference_id: string }[],
                options: { pay: boolean }
            ) => {
                const orders = await completeSplitOrderGroupCheckout({
                    container: appContainer,
                    api,
                    storeHeaders,
                    regionId: region.id,
                    salesChannelId: salesChannel.id,
                    offerIds: [sellerA.offer.id, sellerB.offer.id],
                    email: customerEmail,
                    creditLines: creditLines.map((line) => ({
                        ...line,
                        reference: "store_credit",
                    })),
                    skipPayment: !options.pay,
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
                    orderA: await getOrder(orderIdOf(sellerA.sellerId)),
                    orderB: await getOrder(orderIdOf(sellerB.sellerId)),
                }
            }

            const creditAmount = (line: any) => Number(line.amount)

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

            it("gives each order its share of a partial credit", async () => {
                const { orderA, orderB } = await checkout(
                    [{ amount: 750, reference_id: "credit_1" }],
                    { pay: true }
                )

                expect(orderA.credit_lines.map(creditAmount)).toEqual([300])
                expect(orderB.credit_lines.map(creditAmount)).toEqual([450])
                expect(orderA.credit_lines).toEqual([
                    expect.objectContaining({
                        reference: "store_credit",
                        reference_id: "credit_1",
                        metadata: {
                            cart_credit_line_id: orderA.cart.credit_lines[0].id,
                        },
                    }),
                ])
                expect(orderB.credit_lines).toEqual([
                    expect.objectContaining({
                        reference: "store_credit",
                        reference_id: "credit_1",
                    }),
                ])

                expect(Number(orderA.total)).toEqual(SELLER_A_TOTAL - 300)
                expect(Number(orderB.total)).toEqual(SELLER_B_TOTAL - 450)

                const cartCollection = orderA.cart.payment_collection
                expect(Number(orderA.total) + Number(orderB.total)).toEqual(
                    Number(cartCollection.amount)
                )
            })

            it("settles both orders when the partial credit's payment is captured", async () => {
                const { orderA, orderB } = await checkout(
                    [{ amount: 750, reference_id: "credit_1" }],
                    { pay: true }
                )

                await api.post(
                    `/admin/payments/${orderA.cart.payment_collection.payments[0].id}/capture`,
                    {},
                    adminHeaders
                )

                await eventually(async () => {
                    const paidA = await getOrder(orderA.id)
                    const paidB = await getOrder(orderB.id)

                    expect(
                        Number(paidA.payment_collections[0].payments[0].captures[0].amount)
                    ).toEqual(SELLER_A_TOTAL - 300)
                    expect(
                        Number(paidB.payment_collections[0].payments[0].captures[0].amount)
                    ).toEqual(SELLER_B_TOTAL - 450)
                    expect(Number(paidA.summary.pending_difference)).toEqual(0)
                    expect(Number(paidB.summary.pending_difference)).toEqual(0)
                })
            })

            it("settles both orders with their credit lines when credit covers the whole cart", async () => {
                const { orderA, orderB } = await checkout(
                    [{ amount: SELLER_A_TOTAL + SELLER_B_TOTAL, reference_id: "credit_1" }],
                    { pay: false }
                )

                expect(Number(orderA.credit_line_total)).toEqual(SELLER_A_TOTAL)
                expect(Number(orderB.credit_line_total)).toEqual(SELLER_B_TOTAL)
                expect(Number(orderA.total)).toEqual(0)
                expect(Number(orderB.total)).toEqual(0)
                expect(Number(orderA.summary.pending_difference)).toEqual(0)
                expect(Number(orderB.summary.pending_difference)).toEqual(0)
            })

            it("splits every credit line of a cart that has several", async () => {
                const { orderA, orderB } = await checkout(
                    [
                        { amount: 100, reference_id: "credit_1" },
                        { amount: 200, reference_id: "credit_2" },
                    ],
                    { pay: true }
                )

                const byReference = (order: any) =>
                    Object.fromEntries(
                        order.credit_lines.map((line: any) => [
                            line.reference_id,
                            creditAmount(line),
                        ])
                    )

                expect(byReference(orderA)).toEqual({ credit_1: 40, credit_2: 80 })
                expect(byReference(orderB)).toEqual({ credit_1: 60, credit_2: 120 })
            })
        })
    },
})
