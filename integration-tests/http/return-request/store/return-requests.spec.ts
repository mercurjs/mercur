import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { FlagRouter } from "@medusajs/framework/utils"

import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import {
    createDeliveredOrder,
    createReturnRequestSeller,
} from "../../../helpers/return-request-fixtures"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Store - Return requests", () => {
            let appContainer: MedusaContainer
            let region: { id: string }
            let salesChannel: { id: string }
            let seller: Awaited<ReturnType<typeof createReturnRequestSeller>>
            let storeHeaders: any
            let otherStoreHeaders: any
            const customerEmail = "rr-store-customer@test.com"

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const salesChannelModule = appContainer.resolve<ISalesChannelModuleService>(
                    Modules.SALES_CHANNEL
                )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "RR Store",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: "RR Region",
                    currency_code: "usd",
                    countries: ["us"],
                })

                const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
                })

                const publishableKey = await generatePublishableKey(appContainer)
                const baseStoreHeaders = generateStoreHeaders({ publishableKey })

                const customer = await createCustomerUser(appContainer, {
                    email: customerEmail,
                })
                storeHeaders = {
                    headers: { ...baseStoreHeaders.headers, ...customer.headers.headers },
                }

                const otherCustomer = await createCustomerUser(appContainer, {
                    email: "rr-store-other@test.com",
                })
                otherStoreHeaders = {
                    headers: { ...baseStoreHeaders.headers, ...otherCustomer.headers.headers },
                }

                seller = await createReturnRequestSeller({
                    container: appContainer,
                    api,
                    salesChannelId: salesChannel.id,
                    email: "rr-store-seller@test.com",
                    name: "RRStoreSeller",
                    offerPrice: 2000,
                })
            })

            const deliveredOrder = () =>
                createDeliveredOrder({
                    container: appContainer,
                    api,
                    storeHeaders,
                    sellerHeaders: seller.headers,
                    regionId: region.id,
                    salesChannelId: salesChannel.id,
                    customerEmail,
                    offerId: seller.offer.id,
                    stockLocationId: seller.stockLocationId,
                })

            describe("POST /store/return-requests", () => {
                it("creates a pending request backed by an open Medusa return", async () => {
                    const order = await deliveredOrder()

                    const response = await api.post(
                        `/store/return-requests`,
                        {
                            order_id: order.id,
                            items: [{ id: order.items[0].id, quantity: 1 }],
                            description: "Arrived damaged",
                            attachments: ["https://example.com/damage.jpg"],
                        },
                        storeHeaders
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.return_request).toEqual(
                        expect.objectContaining({
                            status: "pending",
                            order_id: order.id,
                            seller_id: seller.sellerId,
                            requested_by_type: "customer",
                            attachments: ["https://example.com/damage.jpg"],
                            return: expect.objectContaining({ status: "open" }),
                            seller: expect.objectContaining({ id: seller.sellerId }),
                        })
                    )

                    expect(response.data.return_request.items).toEqual([
                        { id: order.items[0].id, quantity: 1, reason_id: null, note: null },
                    ])
                })

                it("rejects quantities above what was fulfilled", async () => {
                    const order = await deliveredOrder()

                    const response = await api
                        .post(
                            `/store/return-requests`,
                            {
                                order_id: order.id,
                                items: [{ id: order.items[0].id, quantity: 5 }],
                            },
                            storeHeaders
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("hides other customers' orders", async () => {
                    const order = await deliveredOrder()

                    const response = await api
                        .post(
                            `/store/return-requests`,
                            {
                                order_id: order.id,
                                items: [{ id: order.items[0].id, quantity: 1 }],
                            },
                            otherStoreHeaders
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("requires an authenticated customer", async () => {
                    const order = await deliveredOrder()
                    const publishableKey = await generatePublishableKey(appContainer)

                    const response = await api
                        .post(
                            `/store/return-requests`,
                            {
                                order_id: order.id,
                                items: [{ id: order.items[0].id, quantity: 1 }],
                            },
                            generateStoreHeaders({ publishableKey })
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(401)
                })
            })

            describe("GET /store/return-requests", () => {
                it("lists only the customer's own requests", async () => {
                    const order = await deliveredOrder()

                    const created = await api.post(
                        `/store/return-requests`,
                        {
                            order_id: order.id,
                            items: [{ id: order.items[0].id, quantity: 1 }],
                        },
                        storeHeaders
                    )

                    const mine = await api.get(`/store/return-requests`, storeHeaders)
                    expect(mine.status).toEqual(200)
                    expect(mine.data.count).toEqual(1)
                    expect(mine.data.return_requests[0].id).toEqual(
                        created.data.return_request.id
                    )

                    const theirs = await api.get(`/store/return-requests`, otherStoreHeaders)
                    expect(theirs.data.count).toEqual(0)

                    const detail = await api
                        .get(
                            `/store/return-requests/${created.data.return_request.id}`,
                            otherStoreHeaders
                        )
                        .catch((e) => e.response)
                    expect(detail.status).toEqual(404)
                })
            })

            describe("POST /store/return-requests/:id/withdraw", () => {
                it("withdraws a pending request and removes the Medusa return", async () => {
                    const order = await deliveredOrder()

                    const created = await api.post(
                        `/store/return-requests`,
                        {
                            order_id: order.id,
                            items: [{ id: order.items[0].id, quantity: 1 }],
                        },
                        storeHeaders
                    )
                    const request = created.data.return_request

                    const response = await api.post(
                        `/store/return-requests/${request.id}/withdraw`,
                        {},
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_request.status).toEqual("withdrawn")
                    expect(response.data.return_request.withdrawn_at).toBeTruthy()

                    const orderReturn = await api
                        .get(`/vendor/returns/${request.return_id}`, seller.headers)
                        .catch((e) => e.response)
                    expect(orderReturn.status).toEqual(404)
                })

                it("cannot withdraw once the seller accepted", async () => {
                    const order = await deliveredOrder()

                    const created = await api.post(
                        `/store/return-requests`,
                        {
                            order_id: order.id,
                            items: [{ id: order.items[0].id, quantity: 1 }],
                        },
                        storeHeaders
                    )
                    const request = created.data.return_request

                    await api.post(
                        `/vendor/return-requests/${request.id}/accept`,
                        { return_required: false },
                        seller.headers
                    )

                    const response = await api
                        .post(`/store/return-requests/${request.id}/withdraw`, {}, storeHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })
            })

            describe("feature flag", () => {
                const flags = () =>
                    appContainer.resolve<FlagRouter>(
                        ContainerRegistrationKeys.FEATURE_FLAG_ROUTER
                    )

                afterEach(() => {
                    flags().setFlag("return_request", true)
                })

                it("blocks the stock /store/returns endpoint while requests are enabled", async () => {
                    const order = await deliveredOrder()

                    const response = await api
                        .post(
                            `/store/returns`,
                            {
                                order_id: order.id,
                                items: [{ id: order.items[0].id, quantity: 1 }],
                                return_shipping: { option_id: seller.returnShippingOptionId },
                            },
                            storeHeaders
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                    expect(response.data.message).toContain("/store/return-requests")
                })

                it("disables the store routes when the flag is off", async () => {
                    const order = await deliveredOrder()
                    flags().setFlag("return_request", false)

                    const response = await api
                        .post(
                            `/store/return-requests`,
                            {
                                order_id: order.id,
                                items: [{ id: order.items[0].id, quantity: 1 }],
                            },
                            storeHeaders
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                    expect(response.data.message).toContain("disabled")
                })
            })
        })
    },
})
