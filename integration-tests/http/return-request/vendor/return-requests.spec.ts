import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import {
    ContainerRegistrationKeys,
    FlagRouter,
    Modules,
} from "@medusajs/framework/utils"

import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import {
    createDeliveredOrder,
    createReturnRequestSeller,
    eventually,
} from "../../../helpers/return-request-fixtures"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Return requests", () => {
            let appContainer: MedusaContainer
            let region: { id: string }
            let salesChannel: { id: string }
            let seller: Awaited<ReturnType<typeof createReturnRequestSeller>>
            let otherSeller: Awaited<ReturnType<typeof createReturnRequestSeller>>
            let storeHeaders: any
            const customerEmail = "rr-vendor-customer@test.com"

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const salesChannelModule = appContainer.resolve<ISalesChannelModuleService>(
                    Modules.SALES_CHANNEL
                )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "RR Vendor Store",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: "RR Vendor Region",
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
                    email: "rr-vendor-seller@test.com",
                    name: "RRVendorSeller",
                    offerPrice: 2000,
                })
                otherSeller = await createReturnRequestSeller({
                    container: appContainer,
                    api,
                    salesChannelId: salesChannel.id,
                    email: "rr-vendor-other@test.com",
                    name: "RRVendorOther",
                    offerPrice: 3000,
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

            describe("GET /vendor/return-requests", () => {
                it("scopes requests to the seller", async () => {
                    const { request } = await customerRequest()

                    const mine = await api.get(`/vendor/return-requests`, seller.headers)
                    expect(mine.status).toEqual(200)
                    expect(mine.data).toEqual(
                        expect.objectContaining({ count: 1, offset: 0, limit: 20 })
                    )
                    expect(mine.data.return_requests[0]).toEqual(
                        expect.objectContaining({
                            id: request.id,
                            status: "pending",
                            customer: expect.objectContaining({ email: customerEmail }),
                        })
                    )

                    const theirs = await api.get(`/vendor/return-requests`, otherSeller.headers)
                    expect(theirs.data.count).toEqual(0)

                    const detail = await api
                        .get(`/vendor/return-requests/${request.id}`, otherSeller.headers)
                        .catch((e) => e.response)
                    expect(detail.status).toEqual(404)
                })
            })

            describe("POST /vendor/return-requests", () => {
                it("lets the seller open a request on a delivered order", async () => {
                    const order = await deliveredOrder()

                    const response = await api.post(
                        `/vendor/return-requests`,
                        {
                            order_id: order.id,
                            items: [{ id: order.items[0].id, quantity: 1, note: "Wrong size" }],
                        },
                        seller.headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.return_request).toEqual(
                        expect.objectContaining({
                            status: "pending",
                            requested_by_type: "seller",
                            requested_by: seller.sellerId,
                            customer_id: expect.any(String),
                        })
                    )
                    expect(response.data.order_preview.items[0].detail).toEqual(
                        expect.objectContaining({ return_requested_quantity: 1 })
                    )
                })

                it("refuses another seller's order", async () => {
                    const order = await deliveredOrder()

                    const response = await api
                        .post(
                            `/vendor/return-requests`,
                            {
                                order_id: order.id,
                                items: [{ id: order.items[0].id, quantity: 1 }],
                            },
                            otherSeller.headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("is gated by the seller_initiated_return_requests flag", async () => {
                    const order = await deliveredOrder()
                    const flags = appContainer.resolve<FlagRouter>(
                        ContainerRegistrationKeys.FEATURE_FLAG_ROUTER
                    )
                    flags.setFlag("seller_initiated_return_requests", false)

                    try {
                        const response = await api
                            .post(
                                `/vendor/return-requests`,
                                {
                                    order_id: order.id,
                                    items: [{ id: order.items[0].id, quantity: 1 }],
                                },
                                seller.headers
                            )
                            .catch((e) => e.response)

                        expect(response.status).toEqual(400)
                    } finally {
                        flags.setFlag("seller_initiated_return_requests", true)
                    }
                })
            })

            describe("POST /vendor/return-requests/:id/accept", () => {
                it("accepts with a physical return and confirms the Medusa return", async () => {
                    const { order, request } = await customerRequest()

                    const response = await api.post(
                        `/vendor/return-requests/${request.id}/accept`,
                        {
                            return_required: true,
                            location_id: seller.stockLocationId,
                            shipping_option_id: seller.returnShippingOptionId,
                        },
                        seller.headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_request).toEqual(
                        expect.objectContaining({
                            status: "awaiting_return",
                            return_required: true,
                            accepted_by: seller.sellerId,
                            accepted_by_type: "seller",
                            return: expect.objectContaining({
                                status: "requested",
                                location_id: seller.stockLocationId,
                            }),
                        })
                    )
                    expect(response.data.return_request.return.items).toHaveLength(1)
                    expect(response.data.return_request.return.items[0]).toEqual(
                        expect.objectContaining({ item_id: order.items[0].id, quantity: 1 })
                    )
                    expect(response.data.return_request.return.shipping_methods).toHaveLength(1)
                    expect(response.data.order_preview).toBeDefined()
                })

                it("accepts without a return and leaves the request for the operator", async () => {
                    const { request } = await customerRequest()

                    const response = await api.post(
                        `/vendor/return-requests/${request.id}/accept`,
                        { return_required: false },
                        seller.headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_request).toEqual(
                        expect.objectContaining({
                            status: "accepted",
                            return_required: false,
                            return: expect.objectContaining({ status: "requested" }),
                        })
                    )
                    expect(response.data.return_request.return.shipping_methods).toHaveLength(0)
                })

                it("requires a location when the item has to come back", async () => {
                    const { request } = await customerRequest()

                    const response = await api
                        .post(
                            `/vendor/return-requests/${request.id}/accept`,
                            { return_required: true },
                            seller.headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("moves to returned once the seller receives the item", async () => {
                    const { order, request } = await customerRequest()

                    await api.post(
                        `/vendor/return-requests/${request.id}/accept`,
                        {
                            return_required: true,
                            location_id: seller.stockLocationId,
                            shipping_option_id: seller.returnShippingOptionId,
                        },
                        seller.headers
                    )

                    await api.post(`/vendor/returns/${request.return_id}/receive`, {}, seller.headers)
                    await api.post(
                        `/vendor/returns/${request.return_id}/receive-items`,
                        { items: [{ id: order.items[0].id, quantity: 1 }] },
                        seller.headers
                    )
                    await api.post(
                        `/vendor/returns/${request.return_id}/receive/confirm`,
                        {},
                        seller.headers
                    )

                    await eventually(async () => {
                        const response = await api.get(
                            `/vendor/return-requests/${request.id}`,
                            seller.headers
                        )
                        expect(response.data.return_request.status).toEqual("returned")
                        expect(response.data.return_request.return.status).toEqual("received")
                    })
                })
            })

            describe("POST /vendor/return-requests/:id/decline", () => {
                it("declines a pending request and cancels the open return", async () => {
                    const { request } = await customerRequest()

                    const response = await api.post(
                        `/vendor/return-requests/${request.id}/decline`,
                        { decline_reason: "Outside the return window", decline_code: "policy" },
                        seller.headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_request).toEqual(
                        expect.objectContaining({
                            status: "declined",
                            declined_by: seller.sellerId,
                            declined_by_type: "seller",
                            decline_reason: "Outside the return window",
                            decline_code: "policy",
                            return: expect.objectContaining({ status: "canceled" }),
                        })
                    )

                    const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
                    const { data: changes } = await query.graph({
                        entity: "order_change",
                        fields: ["id", "status"],
                        filters: { return_id: request.return_id },
                    })
                    expect(changes).toHaveLength(1)
                    expect(changes[0].status).toEqual("declined")
                })

                it("cannot decline a request it already accepted without a return", async () => {
                    const { request } = await customerRequest()

                    await api.post(
                        `/vendor/return-requests/${request.id}/accept`,
                        { return_required: false },
                        seller.headers
                    )

                    const response = await api
                        .post(
                            `/vendor/return-requests/${request.id}/decline`,
                            { decline_reason: "Changed my mind" },
                            seller.headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("requires a reason", async () => {
                    const { request } = await customerRequest()

                    const response = await api
                        .post(`/vendor/return-requests/${request.id}/decline`, {}, seller.headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })
            })
        })
    },
})
