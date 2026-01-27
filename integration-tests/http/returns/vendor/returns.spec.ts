import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import { generatePublishableKey, generateStoreHeaders } from "../../../helpers/create-admin-user"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Returns", () => {
            let appContainer: MedusaContainer
            let seller1: any
            let seller1Headers: any
            let seller2: any
            let seller2Headers: any
            let storeHeaders: any
            let region: any
            let salesChannel: any
            let product1: any
            let product2: any
            let stockLocation1: any
            let stockLocation2: any

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                // Create first seller
                const seller1Result = await createSellerUser(appContainer, {
                    email: "returnsseller1@test.com",
                    name: "Returns Seller 1",
                })
                seller1 = seller1Result.seller
                seller1Headers = seller1Result.headers

                // Create second seller
                const seller2Result = await createSellerUser(appContainer, {
                    email: "returnsseller2@test.com",
                    name: "Returns Seller 2",
                })
                seller2 = seller2Result.seller
                seller2Headers = seller2Result.headers

                // Create customer
                const customerResult = await createCustomerUser(appContainer, {
                    email: "returnscustomer@test.com",
                    first_name: "Returns",
                    last_name: "Customer",
                })

                const apiKey = await generatePublishableKey(appContainer)
                storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
                storeHeaders = { headers: { ...storeHeaders.headers, ...customerResult.headers.headers } }

                // Create sales channel
                const salesChannelModule = appContainer.resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "Returns Test Store",
                })

                // Create region
                const regionModule = appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: "Returns Test Region",
                    currency_code: "usd",
                    countries: ["us"],
                })

                // Link payment provider to region
                const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
                })

                // Create product for seller 1
                const product1Response = await api.post(
                    `/vendor/products`,
                    {
                        status: 'published',
                        title: "Returns Product 1",
                        description: "Product from seller 1 for returns",
                        options: [{ title: "Size", values: ["S", "M"] }],
                        variants: [
                            {
                                title: "Small",
                                sku: "RET-SELLER1-S",
                                options: { Size: "S" },
                                prices: [{ currency_code: "usd", amount: 2000 }],
                                manage_inventory: false,
                            },
                        ],
                        sales_channels: [{ id: salesChannel.id }],
                    },
                    seller1Headers
                )
                product1 = product1Response.data.product

                // Create product for seller 2
                const product2Response = await api.post(
                    `/vendor/products`,
                    {
                        status: 'published',
                        title: "Returns Product 2",
                        description: "Product from seller 2 for returns",
                        options: [{ title: "Color", values: ["Red"] }],
                        variants: [
                            {
                                title: "Red",
                                sku: "RET-SELLER2-RED",
                                options: { Color: "Red" },
                                prices: [{ currency_code: "usd", amount: 3000 }],
                                manage_inventory: false,
                            },
                        ],
                        sales_channels: [{ id: salesChannel.id }],
                    },
                    seller2Headers
                )
                product2 = product2Response.data.product

                // Create shipping prerequisites for seller 1
                const shippingPrerequisites1 = await createShippingPrerequisites(seller1Headers, "retSeller1")
                stockLocation1 = shippingPrerequisites1.stockLocation

                // Create shipping option for seller 1
                await api.post(
                    `/vendor/shipping-options`,
                    {
                        name: "Returns Seller 1 Shipping",
                        service_zone_id: shippingPrerequisites1.serviceZone.id,
                        shipping_profile_id: shippingPrerequisites1.shippingProfile.id,
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
                    seller1Headers
                )

                // Create shipping prerequisites for seller 2
                const shippingPrerequisites2 = await createShippingPrerequisites(seller2Headers, "retSeller2")
                stockLocation2 = shippingPrerequisites2.stockLocation

                // Create shipping option for seller 2
                await api.post(
                    `/vendor/shipping-options`,
                    {
                        name: "Returns Seller 2 Shipping",
                        service_zone_id: shippingPrerequisites2.serviceZone.id,
                        shipping_profile_id: shippingPrerequisites2.shippingProfile.id,
                        provider_id: "manual_manual",
                        price_type: "flat",
                        type: {
                            label: "Standard",
                            description: "Standard shipping",
                            code: "standard",
                        },
                        prices: [{ currency_code: "usd", amount: 600 }],
                        rules: [
                            {
                                attribute: "enabled_in_store",
                                value: "true",
                                operator: "eq",
                            },
                        ],
                    },
                    seller2Headers
                )
            })

            let prerequisiteCounter = 0

            const createShippingPrerequisites = async (headers: any, prefix: string) => {
                const uniqueSuffix = `_${prefix}_${Date.now()}_${++prerequisiteCounter}`

                // Create stock location
                const locationResponse = await api.post(
                    `/vendor/stock-locations`,
                    { name: `RetWarehouse${uniqueSuffix}` },
                    headers
                )
                const stockLocation = locationResponse.data.stock_location

                // Create fulfillment set
                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    {
                        name: `Ret Fulfillment Set${uniqueSuffix}`,
                        type: "shipping",
                    },
                    headers
                )

                const updatedLocation = await api.get(
                    `/vendor/stock-locations/${stockLocation.id}?fields=*fulfillment_sets`,
                    headers
                )
                const fulfillmentSet = updatedLocation.data.stock_location.fulfillment_sets[0]

                // Create service zone
                const serviceZoneResponse = await api.post(
                    `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                    {
                        name: `Ret Service Zone${uniqueSuffix}`,
                        geo_zones: [{ type: "country", country_code: "us" }],
                    },
                    headers
                )
                const serviceZone = serviceZoneResponse.data.fulfillment_set.service_zones.find(
                    (z: any) => z.name === `Ret Service Zone${uniqueSuffix}`
                )

                // Create shipping profile
                const shippingProfileResponse = await api.post(
                    `/vendor/shipping-profiles`,
                    {
                        name: `Ret Shipping Profile${uniqueSuffix}`,
                        type: "default",
                    },
                    headers
                )
                const shippingProfile = shippingProfileResponse.data.shipping_profile

                // Add fulfillment provider
                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-providers`,
                    { add: ["manual_manual"] },
                    headers
                )

                // Link stock location to sales channel
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

            // Helper to create and complete a cart, returning the order with fulfilled items
            const createFulfilledOrder = async (
                sellerHeaders: any,
                product: any,
                stockLocation: any
            ) => {
                // Create cart
                const cartResponse = await api.post(
                    `/store/carts`,
                    {
                        region_id: region.id,
                        sales_channel_id: salesChannel.id,
                        currency_code: "usd",
                    },
                    storeHeaders
                )
                let cart = cartResponse.data.cart

                // Add item
                await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    {
                        variant_id: product.variants[0].id,
                        quantity: 2,
                    },
                    storeHeaders
                )

                // Get shipping options and add shipping method
                const shippingOptionsResponse = await api.get(
                    `/store/shipping-options?cart_id=${cart.id}`,
                    storeHeaders
                )

                const sellerShippingOptions = shippingOptionsResponse.data.shipping_options as Record<string, any[]>

                for (const [, options] of Object.entries(sellerShippingOptions)) {
                    if (options.length > 0) {
                        await api.post(
                            `/store/carts/${cart.id}/shipping-methods`,
                            { option_id: options[0].id },
                            storeHeaders
                        )
                    }
                }

                // Create payment collection
                const paymentCollectionResponse = await api.post(
                    `/store/payment-collections`,
                    { cart_id: cart.id },
                    storeHeaders
                )
                const paymentCollection = paymentCollectionResponse.data.payment_collection

                // Initialize payment session
                await api.post(
                    `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
                    { provider_id: "pp_system_default" },
                    storeHeaders
                )

                // Complete cart
                const completeResponse = await api.post(
                    `/store/carts/${cart.id}/complete`,
                    {},
                    storeHeaders
                )

                const orderGroupId = completeResponse.data.order_group.id

                // Fetch order group with orders
                const orderGroupResponse = await api.get(
                    `/store/order-groups/${orderGroupId}?fields=*orders,orders.seller.id,*orders.items`,
                    storeHeaders
                )

                const order = orderGroupResponse.data.order_group.orders[0]

                // Get order with items for fulfillment
                const orderResponse = await api.get(
                    `/vendor/orders/${order.id}?fields=*items`,
                    sellerHeaders
                )
                const orderWithItems = orderResponse.data.order

                // Create fulfillment
                const fulfillmentResponse = await api.post(
                    `/vendor/orders/${order.id}/fulfillments`,
                    {
                        items: orderWithItems.items.map((item: any) => ({
                            id: item.id,
                            quantity: item.quantity,
                        })),
                        requires_shipping: true,
                        location_id: stockLocation.id,
                    },
                    sellerHeaders
                )

                const fulfillment = fulfillmentResponse.data.fulfillment

                // Create shipment
                await api.post(
                    `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/shipments`,
                    {
                        items: orderWithItems.items.map((item: any) => ({
                            id: item.id,
                            quantity: item.quantity,
                        })),
                    },
                    sellerHeaders
                )

                // Mark as delivered
                await api.post(
                    `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/mark-as-delivered`,
                    {},
                    sellerHeaders
                )

                // Get updated order with items
                const updatedOrderResponse = await api.get(
                    `/vendor/orders/${order.id}?fields=*items`,
                    sellerHeaders
                )

                return {
                    order: updatedOrderResponse.data.order,
                    stockLocation,
                    fulfillment,
                }
            }

            describe("POST /vendor/returns", () => {
                it("should create a return for an order", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    const response = await api.post(
                        `/vendor/returns`,
                        {
                            order_id: order.id,
                            description: "Customer wants to return items",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return).toBeDefined()
                    expect(response.data.return.id).toBeDefined()
                    expect(response.data.order).toBeDefined()
                })

                it("should not allow creating return for another vendor's order", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    const response = await api
                        .post(
                            `/vendor/returns`,
                            {
                                order_id: order.id,
                                description: "Trying to create return on other vendor's order",
                            },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("GET /vendor/returns", () => {
                it("should list returns for the vendor", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return
                    await api.post(
                        `/vendor/returns`,
                        {
                            order_id: order.id,
                        },
                        seller1Headers
                    )

                    const response = await api.get(`/vendor/returns`, seller1Headers)

                    expect(response.status).toEqual(200)
                    expect(response.data.returns).toBeDefined()
                    expect(response.data.returns.length).toBeGreaterThanOrEqual(1)
                })

                it("should only return returns belonging to the vendor", async () => {
                    // Create fulfilled orders for both sellers
                    const { order: order1 } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)
                    const { order: order2 } = await createFulfilledOrder(seller2Headers, product2, stockLocation2)

                    // Create returns for both sellers
                    await api.post(
                        `/vendor/returns`,
                        { order_id: order1.id },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/returns`,
                        { order_id: order2.id },
                        seller2Headers
                    )

                    // Get returns for seller 1
                    const seller1Response = await api.get(`/vendor/returns`, seller1Headers)
                    expect(seller1Response.status).toEqual(200)

                    // Get returns for seller 2
                    const seller2Response = await api.get(`/vendor/returns`, seller2Headers)
                    expect(seller2Response.status).toEqual(200)

                    // Verify no overlap in return IDs
                    const seller1ReturnIds = seller1Response.data.returns.map((r: any) => r.id)
                    const seller2ReturnIds = seller2Response.data.returns.map((r: any) => r.id)

                    const overlap = seller1ReturnIds.filter((id: string) => seller2ReturnIds.includes(id))
                    expect(overlap.length).toEqual(0)
                })
            })

            describe("GET /vendor/returns/:id", () => {
                it("should get a single return by id", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    const response = await api.get(`/vendor/returns/${returnId}`, seller1Headers)

                    expect(response.status).toEqual(200)
                    expect(response.data.return).toBeDefined()
                    expect(response.data.return.id).toEqual(returnId)
                })

                it("should not allow vendor to access another vendor's return", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return as seller 1
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    // Seller 2 tries to access seller 1's return
                    const response = await api
                        .get(`/vendor/returns/${returnId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/returns/:id", () => {
                it("should update a return", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    const response = await api.post(
                        `/vendor/returns/${returnId}`,
                        {
                            location_id: stockLocation1.id,
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return).toBeDefined()
                })

                it("should not allow updating another vendor's return", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return as seller 1
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    // Seller 2 tries to update seller 1's return
                    const response = await api
                        .post(
                            `/vendor/returns/${returnId}`,
                            { location_id: stockLocation2.id },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/returns/:id/request-items", () => {
                it("should add items to return request", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    // Add items to return
                    const response = await api.post(
                        `/vendor/returns/${returnId}/request-items`,
                        {
                            items: order.items.map((item: any) => ({
                                id: item.id,
                                quantity: 1,
                            })),
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return).toBeDefined()
                    expect(response.data.order_preview).toBeDefined()
                })

                it("should not allow adding items to another vendor's return", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return as seller 1
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    // Seller 2 tries to add items to seller 1's return
                    const response = await api
                        .post(
                            `/vendor/returns/${returnId}/request-items`,
                            {
                                items: order.items.map((item: any) => ({
                                    id: item.id,
                                    quantity: 1,
                                })),
                            },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/returns/:id/request", () => {
                it("should confirm return request", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    // Add items to return
                    await api.post(
                        `/vendor/returns/${returnId}/request-items`,
                        {
                            items: order.items.map((item: any) => ({
                                id: item.id,
                                quantity: 1,
                            })),
                        },
                        seller1Headers
                    )

                    // Confirm return request
                    const response = await api.post(
                        `/vendor/returns/${returnId}/request`,
                        {},
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return).toBeDefined()
                    expect(response.data.order_preview).toBeDefined()
                })

                it("should not allow confirming another vendor's return request", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return as seller 1
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    // Add items to return
                    await api.post(
                        `/vendor/returns/${returnId}/request-items`,
                        {
                            items: order.items.map((item: any) => ({
                                id: item.id,
                                quantity: 1,
                            })),
                        },
                        seller1Headers
                    )

                    // Seller 2 tries to confirm seller 1's return request
                    const response = await api
                        .post(
                            `/vendor/returns/${returnId}/request`,
                            {},
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("DELETE /vendor/returns/:id/request", () => {
                it("should cancel return request", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    // Add items to return
                    await api.post(
                        `/vendor/returns/${returnId}/request-items`,
                        {
                            items: order.items.map((item: any) => ({
                                id: item.id,
                                quantity: 1,
                            })),
                        },
                        seller1Headers
                    )

                    // Cancel return request
                    const response = await api.delete(
                        `/vendor/returns/${returnId}/request`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.id).toEqual(returnId)
                    expect(response.data.object).toEqual("return")
                    expect(response.data.deleted).toEqual(true)
                })

                it("should not allow canceling another vendor's return request", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return as seller 1
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    // Seller 2 tries to cancel seller 1's return request
                    const response = await api
                        .delete(`/vendor/returns/${returnId}/request`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/returns/:id/receive", () => {
                it("should begin receiving a return", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    // Add items to return
                    await api.post(
                        `/vendor/returns/${returnId}/request-items`,
                        {
                            items: order.items.map((item: any) => ({
                                id: item.id,
                                quantity: 1,
                            })),
                        },
                        seller1Headers
                    )

                    // Confirm return request
                    await api.post(
                        `/vendor/returns/${returnId}/request`,
                        {},
                        seller1Headers
                    )

                    // Begin receiving the return
                    const response = await api.post(
                        `/vendor/returns/${returnId}/receive`,
                        {
                            description: "Beginning to receive return",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return).toBeDefined()
                    expect(response.data.order).toBeDefined()
                })

                it("should not allow receiving another vendor's return", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return as seller 1
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    // Add items and confirm
                    await api.post(
                        `/vendor/returns/${returnId}/request-items`,
                        {
                            items: order.items.map((item: any) => ({
                                id: item.id,
                                quantity: 1,
                            })),
                        },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/returns/${returnId}/request`,
                        {},
                        seller1Headers
                    )

                    // Seller 2 tries to receive seller 1's return
                    const response = await api
                        .post(
                            `/vendor/returns/${returnId}/receive`,
                            {},
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/returns/:id/cancel", () => {
                it("should cancel a return", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    // Add items to return
                    await api.post(
                        `/vendor/returns/${returnId}/request-items`,
                        {
                            items: order.items.map((item: any) => ({
                                id: item.id,
                                quantity: 1,
                            })),
                        },
                        seller1Headers
                    )

                    // Confirm return request
                    await api.post(
                        `/vendor/returns/${returnId}/request`,
                        {},
                        seller1Headers
                    )

                    // Cancel the return
                    const response = await api.post(
                        `/vendor/returns/${returnId}/cancel`,
                        {},
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                })

                it("should not allow canceling another vendor's return", async () => {
                    const { order } = await createFulfilledOrder(seller1Headers, product1, stockLocation1)

                    // Create a return as seller 1
                    const createResponse = await api.post(
                        `/vendor/returns`,
                        { order_id: order.id },
                        seller1Headers
                    )
                    const returnId = createResponse.data.return.id

                    // Add items and confirm
                    await api.post(
                        `/vendor/returns/${returnId}/request-items`,
                        {
                            items: order.items.map((item: any) => ({
                                id: item.id,
                                quantity: 1,
                            })),
                        },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/returns/${returnId}/request`,
                        {},
                        seller1Headers
                    )

                    // Seller 2 tries to cancel seller 1's return
                    const response = await api
                        .post(
                            `/vendor/returns/${returnId}/cancel`,
                            {},
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
