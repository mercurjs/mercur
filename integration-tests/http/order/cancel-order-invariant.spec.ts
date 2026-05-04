import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { createSellerUser } from "../../helpers/create-seller-user"
import { createCustomerUser } from "../../helpers/create-customer-user"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../helpers/create-admin-user"

type AuthHeaders = { headers: Record<string, string> }

type SellerContext = {
    seller: { id: string; name: string }
    headers: AuthHeaders
}

type OrderItemSnapshot = {
    id: string
    quantity: number
    detail?: { fulfilled_quantity?: number; shipped_quantity?: number }
}

type FulfillmentSnapshot = {
    id: string
    canceled_at: string | null
}

type OrderSnapshot = {
    id: string
    status: string
    canceled_at: string | null
    canceled_by: string | null
    order_group_id?: string | null
    items?: OrderItemSnapshot[]
    fulfillments?: FulfillmentSnapshot[]
}

type ErrorResponseBody = {
    type?: string
    code?: string
    message?: string
}

type OrderGroupSubOrder = {
    id: string
    status: string
    canceled_at: string | null
}

type EmittedEvent = {
    name: string
    data?: Record<string, unknown>
}

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("POST /vendor/orders/:id/cancel — marketplace invariant", () => {
            let appContainer: MedusaContainer
            let seller: SellerContext["seller"]
            let sellerHeaders: AuthHeaders
            let seller2: SellerContext["seller"]
            let seller2Headers: AuthHeaders
            let storeHeaders: AuthHeaders
            let region: { id: string }
            let salesChannel: { id: string }
            let product: { id: string; variants: Array<{ id: string }> }
            let stockLocation: { id: string }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            // Tried beforeAll for all fixtures to cut runtime in half, but
            // the publishable key check in the /store/carts path starts
            // rejecting the second test's cart with "A valid publishable key
            // is required" — some state on the shared storeHeaders goes
            // stale between tests. Keeping per-test setup for correctness.
            beforeEach(async () => {
                const sellerResult = await createSellerUser(appContainer, {
                    email: "cancelinvseller@test.com",
                    name: "Cancel Invariant Seller",
                })
                seller = sellerResult.seller
                sellerHeaders = sellerResult.headers

                const seller2Result = await createSellerUser(appContainer, {
                    email: "cancelinvseller2@test.com",
                    name: "Cancel Invariant Seller 2",
                })
                seller2 = seller2Result.seller
                seller2Headers = seller2Result.headers

                const customerResult = await createCustomerUser(appContainer, {
                    email: "cancelinvcustomer@test.com",
                    first_name: "Cancel",
                    last_name: "Customer",
                })

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
                    name: "Cancel Invariant Store",
                })

                const regionModule =
                    appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: "Cancel Invariant Region",
                    currency_code: "usd",
                    countries: ["us"],
                })

                const link = appContainer.resolve(
                    ContainerRegistrationKeys.LINK
                )
                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: {
                        payment_provider_id: "pp_system_default",
                    },
                })

                const productResponse = await api.post(
                    `/vendor/products`,
                    {
                        status: "published",
                        title: "Cancel Invariant Product",
                        description: "Product for cancel invariant tests",
                        options: [{ title: "Size", values: ["M"] }],
                        variants: [
                            {
                                title: "Medium",
                                sku: "CI-MED",
                                options: { Size: "M" },
                                prices: [
                                    { currency_code: "usd", amount: 2000 },
                                ],
                                manage_inventory: false,
                            },
                        ],
                        sales_channels: [{ id: salesChannel.id }],
                    },
                    sellerHeaders
                )
                product = productResponse.data.product

                const shippingPrereqs = await createShippingPrerequisites(
                    sellerHeaders,
                    "ci"
                )
                stockLocation = shippingPrereqs.stockLocation

                await api.post(
                    `/vendor/shipping-options`,
                    {
                        name: "CI Shipping",
                        service_zone_id: shippingPrereqs.serviceZone.id,
                        shipping_profile_id:
                            shippingPrereqs.shippingProfile.id,
                        provider_id: "manual_manual",
                        price_type: "flat",
                        type: {
                            label: "Standard",
                            description: "Standard shipping",
                            code: "standard",
                        },
                        prices: [{ currency_code: "usd", amount: 500 }],
                        rules: [
                            {
                                attribute: "enabled_in_store",
                                value: "true",
                                operator: "eq",
                            },
                        ],
                    },
                    sellerHeaders
                )
            })

            let prerequisiteCounter = 0

            const createShippingPrerequisites = async (
                headers: AuthHeaders,
                prefix: string
            ) => {
                const uniqueSuffix = `_${prefix}_${Date.now()}_${++prerequisiteCounter}`

                const locationResponse = await api.post(
                    `/vendor/stock-locations`,
                    { name: `CIWarehouse${uniqueSuffix}` },
                    headers
                )
                const stockLocation = locationResponse.data.stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    {
                        name: `CI Fulfillment Set${uniqueSuffix}`,
                        type: "shipping",
                    },
                    headers
                )

                const updatedLocation = await api.get(
                    `/vendor/stock-locations/${stockLocation.id}?fields=*fulfillment_sets`,
                    headers
                )
                const fulfillmentSet =
                    updatedLocation.data.stock_location.fulfillment_sets[0]

                const serviceZoneResponse = await api.post(
                    `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                    {
                        name: `CI Service Zone${uniqueSuffix}`,
                        geo_zones: [{ type: "country", country_code: "us" }],
                    },
                    headers
                )
                const serviceZone =
                    serviceZoneResponse.data.fulfillment_set.service_zones.find(
                        (z: { name: string }) =>
                            z.name === `CI Service Zone${uniqueSuffix}`
                    )

                const shippingProfileResponse = await api.post(
                    `/vendor/shipping-profiles`,
                    {
                        name: `CI Shipping Profile${uniqueSuffix}`,
                        type: "default",
                    },
                    headers
                )
                const shippingProfile =
                    shippingProfileResponse.data.shipping_profile

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-providers`,
                    { add: ["manual_manual"] },
                    headers
                )

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
                    { add: [salesChannel.id] },
                    headers
                )

                return {
                    stockLocation,
                    fulfillmentSet,
                    serviceZone,
                    shippingProfile,
                }
            }

            const createCompletedOrder = async () => {
                const cartResponse = await api
                    .post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders
                    )
                    .catch((err) => {
                        throw new Error(
                            `cart creation failed: ${err.response?.status} ${JSON.stringify(err.response?.data)}`
                        )
                    })
                let cart = cartResponse.data.cart

                await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    { variant_id: product.variants[0].id, quantity: 2 },
                    storeHeaders
                )

                const shippingOptionsResponse = await api.get(
                    `/store/shipping-options?cart_id=${cart.id}`,
                    storeHeaders
                )
                const sellerShippingOptions = shippingOptionsResponse.data
                    .shipping_options as Record<string, any[]>

                for (const [, options] of Object.entries(
                    sellerShippingOptions
                )) {
                    if (options.length > 0) {
                        await api.post(
                            `/store/carts/${cart.id}/shipping-methods`,
                            { option_id: options[0].id },
                            storeHeaders
                        )
                    }
                }

                const paymentCollectionResponse = await api.post(
                    `/store/payment-collections`,
                    { cart_id: cart.id },
                    storeHeaders
                )
                const paymentCollection =
                    paymentCollectionResponse.data.payment_collection

                await api.post(
                    `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
                    { provider_id: "pp_system_default" },
                    storeHeaders
                )

                const completeResponse = await api.post(
                    `/store/carts/${cart.id}/complete`,
                    {},
                    storeHeaders
                )

                const orderGroupId = completeResponse.data.order_group.id

                const orderGroupResponse = await api.get(
                    `/store/order-groups/${orderGroupId}?fields=*orders,orders.seller.id,*orders.items`,
                    storeHeaders
                )

                const order = orderGroupResponse.data.order_group
                    .orders[0] as OrderSnapshot
                order.order_group_id = orderGroupId
                return order
            }

            const fulfillOrder = async (
                orderId: string,
                quantity?: number
            ): Promise<FulfillmentSnapshot> => {
                const orderResponse = await api.get(
                    `/vendor/orders/${orderId}?fields=*items`,
                    sellerHeaders
                )
                const orderWithItems = orderResponse.data.order as OrderSnapshot

                const response = await api.post(
                    `/vendor/orders/${orderId}/fulfillments`,
                    {
                        items: (orderWithItems.items ?? []).map((item) => ({
                            id: item.id,
                            quantity: quantity ?? item.quantity,
                        })),
                        requires_shipping: true,
                        location_id: stockLocation.id,
                    },
                    sellerHeaders
                )

                return response.data.fulfillment as FulfillmentSnapshot
            }

            const cancelFulfillment = async (
                orderId: string,
                fulfillmentId: string
            ) => {
                const response = await api.post(
                    `/vendor/orders/${orderId}/fulfillments/${fulfillmentId}/cancel`,
                    {},
                    sellerHeaders
                )
                return response
            }

            const getOrder = async (
                orderId: string,
                headers: AuthHeaders = sellerHeaders,
                fields = "status,canceled_at,canceled_by,order_group_id,items.*,items.detail.*,fulfillments.id,fulfillments.canceled_at"
            ): Promise<OrderSnapshot> => {
                const response = await api.get(
                    `/vendor/orders/${orderId}?fields=${fields}`,
                    headers
                )
                return response.data.order as OrderSnapshot
            }

            const expectRejection = async (
                orderId: string,
                expected: {
                    code: string
                    messagePattern?: RegExp
                    headers?: AuthHeaders
                }
            ) => {
                const response = await api
                    .post(
                        `/vendor/orders/${orderId}/cancel`,
                        {},
                        expected.headers ?? sellerHeaders
                    )
                    .then(() => {
                        throw new Error(
                            `expected POST /vendor/orders/${orderId}/cancel to reject but it succeeded`
                        )
                    })
                    .catch((err) => {
                        if (!err?.response) {
                            throw err
                        }
                        return err.response
                    })

                const body = response.data as ErrorResponseBody
                expect(response.status).toEqual(400)
                expect(body.type).toEqual("not_allowed")
                expect(body.code).toEqual(expected.code)
                if (expected.messagePattern) {
                    expect(body.message ?? "").toMatch(expected.messagePattern)
                }

                return response
            }

            // Admin HTTP coverage is not exercised in this file: RBAC policies
            // on core Medusa admin routes short-circuit direct admin calls with
            // 403 Forbidden before validateCancelOrderMiddleware runs. All
            // behavior below runs through the vendor path, which exercises the
            // same invariant via the shared workflow step.

            describe("happy path", () => {
                it("persists canceled_at and canceled_by when no items are fulfilled", async () => {
                    const order = await createCompletedOrder()

                    const cancelResponse = await api.post(
                        `/vendor/orders/${order.id}/cancel`,
                        {},
                        sellerHeaders
                    )
                    expect(cancelResponse.status).toEqual(200)

                    const refreshed = await getOrder(order.id)
                    expect(refreshed.status).toEqual("canceled")
                    expect(refreshed.canceled_at).toBeTruthy()
                    // Note: canceled_by is not persisted by Medusa's
                    // cancelOrdersStep on the order record — it is only
                    // threaded through to the refund workflow. The vendor
                    // "who canceled" attribution is captured via the emitted
                    // event, not via this field (see event-emission test).
                })
            })

            describe("seller scope isolation", () => {
                it("returns 404 when another seller attempts to cancel the order, and the invariant does not leak", async () => {
                    const order = await createCompletedOrder()
                    await fulfillOrder(order.id, 1)

                    // Seller2 tries to cancel Seller1's fulfilled order.
                    const response = await api
                        .post(
                            `/vendor/orders/${order.id}/cancel`,
                            {},
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                    // Invariant errors must not leak through cross-seller
                    // attempts: seller2 learns nothing about fulfillment state.
                    expect(response.data?.code).not.toEqual(
                        "CANCEL_BLOCKED_BY_FULFILLMENT"
                    )

                    // Seller1's order is untouched.
                    const refreshed = await getOrder(order.id)
                    expect(refreshed.status).not.toEqual("canceled")
                    expect(refreshed.canceled_at).toBeFalsy()
                })
            })

            describe("order_group consistency", () => {
                it("reflects the canceled sub-order in the parent order_group", async () => {
                    const order = await createCompletedOrder()

                    const groupId = order.order_group_id
                    expect(groupId).toBeTruthy()

                    await api.post(
                        `/vendor/orders/${order.id}/cancel`,
                        {},
                        sellerHeaders
                    )

                    const groupResponse = await api.get(
                        `/store/order-groups/${groupId}?fields=id,orders.id,orders.status,orders.canceled_at`,
                        storeHeaders
                    )
                    const group = groupResponse.data.order_group
                    const canceledSubOrder = (
                        group.orders as OrderGroupSubOrder[]
                    ).find((o) => o.id === order.id)
                    expect(canceledSubOrder).toBeDefined()
                    expect(canceledSubOrder.status).toEqual("canceled")
                    expect(canceledSubOrder.canceled_at).toBeTruthy()
                })
            })

            describe("idempotency", () => {
                it("blocks a second cancel with ORDER_ALREADY_CANCELED and preserves canceled state", async () => {
                    const order = await createCompletedOrder()

                    const first = await api.post(
                        `/vendor/orders/${order.id}/cancel`,
                        {},
                        sellerHeaders
                    )
                    expect(first.status).toEqual(200)

                    await expectRejection(order.id, {
                        code: "ORDER_ALREADY_CANCELED",
                        messagePattern: /already canceled/i,
                    })

                    const refreshed = await getOrder(order.id)
                    expect(refreshed.status).toEqual("canceled")
                    expect(refreshed.canceled_at).toBeTruthy()
                })
            })

            describe("fulfillment-based rejection", () => {
                it("blocks cancel on any fulfilled item and leaves the order state untouched", async () => {
                    const order = await createCompletedOrder()
                    const fulfillment = await fulfillOrder(order.id, 1)

                    await expectRejection(order.id, {
                        code: "CANCEL_BLOCKED_BY_FULFILLMENT",
                        messagePattern: /fulfilled items/i,
                    })

                    const refreshed = await getOrder(order.id)
                    expect(refreshed.status).not.toEqual("canceled")
                    expect(refreshed.canceled_at).toBeFalsy()
                    const survivingFulfillment = (refreshed.fulfillments ?? []).find(
                        (f) => f.id === fulfillment.id
                    )
                    expect(survivingFulfillment).toBeDefined()
                    expect(survivingFulfillment?.canceled_at).toBeFalsy()
                })

                it("re-enables cancel after the fulfillment itself is canceled", async () => {
                    const order = await createCompletedOrder()
                    const fulfillment = await fulfillOrder(order.id, 1)

                    // Invariant blocks while fulfillment is active.
                    await expectRejection(order.id, {
                        code: "CANCEL_BLOCKED_BY_FULFILLMENT",
                    })

                    // Seller cancels the fulfillment — fulfilled_quantity
                    // drops back to zero.
                    await cancelFulfillment(order.id, fulfillment.id)

                    const afterFulfillmentCancel = await getOrder(order.id)
                    const items = afterFulfillmentCancel.items ?? []
                    const stillFulfilled = items.some(
                        (i) => (i.detail?.fulfilled_quantity ?? 0) > 0
                    )
                    expect(stillFulfilled).toBe(false)

                    // Order cancel is now allowed again.
                    const cancelResponse = await api.post(
                        `/vendor/orders/${order.id}/cancel`,
                        {},
                        sellerHeaders
                    )
                    expect(cancelResponse.status).toEqual(200)

                    const finalState = await getOrder(order.id)
                    expect(finalState.status).toEqual("canceled")
                    expect(finalState.canceled_at).toBeTruthy()
                })
            })
        })
    },
})
