import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import {
    adminHeaders,
    createAdminUser,
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
    captureOrderPayment,
    createDeliveredOrder,
    createReturnRequestSeller,
} from "../../../helpers/return-request-fixtures"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Admin - Return requests", () => {
            let appContainer: MedusaContainer
            let region: { id: string }
            let salesChannel: { id: string }
            let seller: Awaited<ReturnType<typeof createReturnRequestSeller>>
            let storeHeaders: any
            const customerEmail = "rr-admin-customer@test.com"

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)

                const salesChannelModule = appContainer.resolve<ISalesChannelModuleService>(
                    Modules.SALES_CHANNEL
                )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "RR Admin Store",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: "RR Admin Region",
                    currency_code: "usd",
                    countries: ["us"],
                })

                const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
                })

                const publishableKey = await generatePublishableKey(appContainer)
                const customer = await createCustomerUser(appContainer, { email: customerEmail })
                storeHeaders = {
                    headers: {
                        ...generateStoreHeaders({ publishableKey }).headers,
                        ...customer.headers.headers,
                    },
                }

                seller = await createReturnRequestSeller({
                    container: appContainer,
                    api,
                    salesChannelId: salesChannel.id,
                    email: "rr-admin-seller@test.com",
                    name: "RRAdminSeller",
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

            const customerRequest = async () => {
                const order = await deliveredOrder()
                const response = await api.post(
                    `/store/return-requests`,
                    {
                        order_id: order.id,
                        items: [{ id: order.items[0].id, quantity: 1 }],
                    },
                    storeHeaders
                )
                return { order, request: response.data.return_request }
            }

            describe("GET /admin/return-requests", () => {
                it("lists and filters by status", async () => {
                    const { request } = await customerRequest()

                    const pending = await api.get(
                        `/admin/return-requests?status=pending`,
                        adminHeaders
                    )
                    expect(pending.status).toEqual(200)
                    expect(pending.data).toEqual(
                        expect.objectContaining({ count: 1, offset: 0, limit: 20 })
                    )
                    expect(pending.data.return_requests[0]).toEqual(
                        expect.objectContaining({
                            id: request.id,
                            seller: expect.objectContaining({ id: seller.sellerId }),
                            customer: expect.objectContaining({ email: customerEmail }),
                        })
                    )

                    const refunded = await api.get(
                        `/admin/return-requests?status=refunded`,
                        adminHeaders
                    )
                    expect(refunded.data.count).toEqual(0)
                })
            })

            describe("POST /admin/return-requests", () => {
                it("opens a request on behalf of the customer", async () => {
                    const order = await deliveredOrder()

                    const response = await api.post(
                        `/admin/return-requests`,
                        {
                            order_id: order.id,
                            items: [{ id: order.items[0].id, quantity: 1 }],
                            requested_by_type: "customer",
                        },
                        adminHeaders
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.return_request).toEqual(
                        expect.objectContaining({
                            status: "pending",
                            requested_by_type: "customer",
                            seller_id: seller.sellerId,
                        })
                    )
                })
            })

            describe("POST /admin/return-requests/:id/accept and /decline", () => {
                it("accepts as the operator", async () => {
                    const { request } = await customerRequest()

                    const response = await api.post(
                        `/admin/return-requests/${request.id}/accept`,
                        { return_required: false },
                        adminHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_request).toEqual(
                        expect.objectContaining({
                            status: "accepted",
                            accepted_by_type: "admin",
                        })
                    )
                })

                it("declines a request the seller already accepted", async () => {
                    const { request } = await customerRequest()

                    await api.post(
                        `/vendor/return-requests/${request.id}/accept`,
                        { return_required: false },
                        seller.headers
                    )

                    const response = await api.post(
                        `/admin/return-requests/${request.id}/decline`,
                        { decline_reason: "Does not meet the marketplace policy" },
                        adminHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_request).toEqual(
                        expect.objectContaining({
                            status: "declined",
                            declined_by_type: "admin",
                            return: expect.objectContaining({ status: "canceled" }),
                        })
                    )
                })
            })

            describe("POST /admin/return-requests/:id/approve", () => {
                it("refunds the customer and closes the request", async () => {
                    const { order, request } = await customerRequest()
                    const paymentId = await captureOrderPayment({
                        container: appContainer,
                        api,
                        adminHeaders,
                        orderId: order.id,
                    })

                    await api.post(
                        `/vendor/return-requests/${request.id}/accept`,
                        { return_required: false },
                        seller.headers
                    )

                    const response = await api.post(
                        `/admin/return-requests/${request.id}/approve`,
                        { refund_note: "Approved by operator" },
                        adminHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_request).toEqual(
                        expect.objectContaining({
                            status: "refunded",
                            refund_amount: 2000,
                            refund_note: "Approved by operator",
                            refunded_at: expect.any(String),
                            return: expect.objectContaining({ refund_amount: 2000 }),
                        })
                    )

                    const payment = await api.get(
                        `/admin/payments/${paymentId}?fields=*refunds`,
                        adminHeaders
                    )
                    expect(payment.data.payment.refunds).toHaveLength(1)
                    expect(Number(payment.data.payment.refunds[0].amount)).toEqual(2000)
                })

                it("honours an operator override of the amount", async () => {
                    const { order, request } = await customerRequest()
                    await captureOrderPayment({
                        container: appContainer,
                        api,
                        adminHeaders,
                        orderId: order.id,
                    })

                    await api.post(
                        `/vendor/return-requests/${request.id}/accept`,
                        { return_required: false },
                        seller.headers
                    )

                    const response = await api.post(
                        `/admin/return-requests/${request.id}/approve`,
                        { refund_amount: 1500 },
                        adminHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_request.refund_amount).toEqual(1500)
                })

                it("refuses to refund a request the seller has not actioned", async () => {
                    const { request } = await customerRequest()

                    const response = await api
                        .post(`/admin/return-requests/${request.id}/approve`, {}, adminHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("refuses to refund more than was captured", async () => {
                    const { order, request } = await customerRequest()
                    await captureOrderPayment({
                        container: appContainer,
                        api,
                        adminHeaders,
                        orderId: order.id,
                    })

                    await api.post(
                        `/vendor/return-requests/${request.id}/accept`,
                        { return_required: false },
                        seller.headers
                    )

                    const response = await api
                        .post(
                            `/admin/return-requests/${request.id}/approve`,
                            { refund_amount: 999999 },
                            adminHeaders
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })
            })
        })
    },
})
