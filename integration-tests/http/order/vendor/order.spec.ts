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
        describe("Vendor - Order Management", () => {
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
                    email: "vendororder1@test.com",
                    name: "Vendor Order Seller 1",
                })
                seller1 = seller1Result.seller
                seller1Headers = seller1Result.headers

                // Create second seller
                const seller2Result = await createSellerUser(appContainer, {
                    email: "vendororder2@test.com",
                    name: "Vendor Order Seller 2",
                })
                seller2 = seller2Result.seller
                seller2Headers = seller2Result.headers

                // Create customer
                const customerResult = await createCustomerUser(appContainer, {
                    email: "vendorordercustomer@test.com",
                    first_name: "Vendor",
                    last_name: "Customer",
                })

                const apiKey = await generatePublishableKey(appContainer)
                storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
                storeHeaders = { headers: { ...storeHeaders.headers, ...customerResult.headers.headers } }

                // Create sales channel
                const salesChannelModule = appContainer.resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "Vendor Order Test Store",
                })

                // Create region
                const regionModule = appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: "Vendor Order Test Region",
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
                        title: "Vendor Order Product 1",
                        description: "Product from seller 1",
                        options: [{ title: "Size", values: ["S", "M"] }],
                        variants: [
                            {
                                title: "Small",
                                sku: "VO-SELLER1-S",
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
                        title: "Vendor Order Product 2",
                        description: "Product from seller 2",
                        options: [{ title: "Color", values: ["Red"] }],
                        variants: [
                            {
                                title: "Red",
                                sku: "VO-SELLER2-RED",
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
                const shippingPrerequisites1 = await createShippingPrerequisites(seller1Headers, "voSeller1")
                stockLocation1 = shippingPrerequisites1.stockLocation

                // Create shipping option for seller 1
                await api.post(
                    `/vendor/shipping-options`,
                    {
                        name: "VO Seller 1 Shipping",
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
                const shippingPrerequisites2 = await createShippingPrerequisites(seller2Headers, "voSeller2")
                stockLocation2 = shippingPrerequisites2.stockLocation

                // Create shipping option for seller 2
                await api.post(
                    `/vendor/shipping-options`,
                    {
                        name: "VO Seller 2 Shipping",
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
                    { name: `VOWarehouse${uniqueSuffix}` },
                    headers
                )
                const stockLocation = locationResponse.data.stock_location

                // Create fulfillment set
                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    {
                        name: `VO Fulfillment Set${uniqueSuffix}`,
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
                        name: `VO Service Zone${uniqueSuffix}`,
                        geo_zones: [{ type: "country", country_code: "us" }],
                    },
                    headers
                )
                const serviceZone = serviceZoneResponse.data.fulfillment_set.service_zones.find(
                    (z: any) => z.name === `VO Service Zone${uniqueSuffix}`
                )

                // Create shipping profile
                const shippingProfileResponse = await api.post(
                    `/vendor/shipping-profiles`,
                    {
                        name: `VO Shipping Profile${uniqueSuffix}`,
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

            // Helper to create and complete a cart, returning the order
            const createCompletedOrder = async (
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
                return { order, cart, stockLocation }
            }

            describe("GET /vendor/orders", () => {
                it("should list orders for the vendor", async () => {
                    // Create an order for seller 1
                    await createCompletedOrder(seller1Headers, product1, stockLocation1)

                    const response = await api.get(`/vendor/orders`, seller1Headers)

                    expect(response.status).toEqual(200)
                    expect(response.data.orders).toBeDefined()
                    expect(response.data.orders.length).toBeGreaterThanOrEqual(1)
                })

                it("should only return orders belonging to the vendor", async () => {
                    // Create orders for both sellers
                    await createCompletedOrder(seller1Headers, product1, stockLocation1)
                    await createCompletedOrder(seller2Headers, product2, stockLocation2)

                    // Get orders for seller 1
                    const seller1Response = await api.get(`/vendor/orders`, seller1Headers)
                    expect(seller1Response.status).toEqual(200)

                    // Get orders for seller 2
                    const seller2Response = await api.get(`/vendor/orders`, seller2Headers)
                    expect(seller2Response.status).toEqual(200)

                    // Verify seller 1 orders don't include seller 2's orders
                    const seller1OrderIds = seller1Response.data.orders.map((o: any) => o.id)
                    const seller2OrderIds = seller2Response.data.orders.map((o: any) => o.id)

                    // No overlap between order IDs
                    const overlap = seller1OrderIds.filter((id: string) => seller2OrderIds.includes(id))
                    expect(overlap.length).toEqual(0)
                })
            })

            describe("GET /vendor/orders/:id", () => {
                it("should get a single order by id", async () => {
                    const { order } = await createCompletedOrder(seller1Headers, product1, stockLocation1)

                    const response = await api.get(`/vendor/orders/${order.id}`, seller1Headers)

                    expect(response.status).toEqual(200)
                    expect(response.data.order).toBeDefined()
                    expect(response.data.order.id).toEqual(order.id)
                })

                it("should not allow vendor to access another vendor's order", async () => {
                    const { order } = await createCompletedOrder(seller1Headers, product1, stockLocation1)

                    // Seller 2 tries to access seller 1's order
                    const response = await api
                        .get(`/vendor/orders/${order.id}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/orders/:id/cancel", () => {
                it("should cancel an order", async () => {
                    const { order } = await createCompletedOrder(seller1Headers, product1, stockLocation1)

                    const response = await api.post(
                        `/vendor/orders/${order.id}/cancel`,
                        {},
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.order).toBeDefined()
                    expect(response.data.order.status).toEqual("canceled")
                })

                it("should not allow canceling another vendor's order", async () => {
                    const { order } = await createCompletedOrder(seller1Headers, product1, stockLocation1)

                    const response = await api
                        .post(
                            `/vendor/orders/${order.id}/cancel`,
                            {},
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("GET /vendor/orders/:id/changes", () => {
                it("should get order changes", async () => {
                    const { order } = await createCompletedOrder(seller1Headers, product1, stockLocation1)

                    const response = await api.get(
                        `/vendor/orders/${order.id}/changes`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.order_changes).toBeDefined()
                    expect(Array.isArray(response.data.order_changes)).toBe(true)
                })

                it("should not allow accessing changes of another vendor's order", async () => {
                    const { order } = await createCompletedOrder(seller1Headers, product1, stockLocation1)

                    const response = await api
                        .get(
                            `/vendor/orders/${order.id}/changes`,
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/orders/:id/fulfillments", () => {
                it("should create a fulfillment for an order", async () => {
                    const { order, stockLocation } = await createCompletedOrder(
                        seller1Headers,
                        product1,
                        stockLocation1
                    )

                    // Get the order with items
                    const orderResponse = await api.get(
                        `/vendor/orders/${order.id}?fields=*items`,
                        seller1Headers
                    )
                    const orderWithItems = orderResponse.data.order

                    const response = await api.post(
                        `/vendor/orders/${order.id}/fulfillments`,
                        {
                            items: orderWithItems.items.map((item: any) => ({
                                id: item.id,
                                quantity: item.quantity,
                            })),
                            requires_shipping: true,
                            location_id: stockLocation.id,
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.fulfillment).toBeDefined()
                    expect(response.data.fulfillment.id).toBeDefined()
                })

                it("should not allow creating fulfillment for another vendor's order", async () => {
                    const { order } = await createCompletedOrder(seller1Headers, product1, stockLocation1)

                    // Get the order with items using seller 1's access
                    const orderResponse = await api.get(
                        `/vendor/orders/${order.id}?fields=*items`,
                        seller1Headers
                    )
                    const orderWithItems = orderResponse.data.order

                    // Seller 2 tries to create fulfillment
                    const response = await api
                        .post(
                            `/vendor/orders/${order.id}/fulfillments`,
                            {
                                items: orderWithItems.items.map((item: any) => ({
                                    id: item.id,
                                    quantity: item.quantity,
                                })),
                                requires_shipping: true,
                                location_id: stockLocation2.id,
                            },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/orders/:id/fulfillments/:fulfillment_id/shipments", () => {
                it("should create a shipment for a fulfillment", async () => {
                    const { order, stockLocation } = await createCompletedOrder(
                        seller1Headers,
                        product1,
                        stockLocation1
                    )

                    // Get the order with items
                    const orderResponse = await api.get(
                        `/vendor/orders/${order.id}?fields=*items`,
                        seller1Headers
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
                        seller1Headers
                    )

                    const fulfillment = fulfillmentResponse.data.fulfillment

                    // Create shipment
                    const shipmentResponse = await api.post(
                        `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/shipments`,
                        {
                            items: orderWithItems.items.map((item: any) => ({
                                id: item.id,
                                quantity: item.quantity,
                            })),
                            labels: [
                                {
                                    tracking_number: "TRACK123",
                                    tracking_url: "https://tracking.example.com/TRACK123",
                                    label_url: "https://labels.example.com/TRACK123.pdf",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(shipmentResponse.status).toEqual(200)
                    expect(shipmentResponse.data.order).toBeDefined()
                })
            })

            describe("POST /vendor/orders/:id/fulfillments/:fulfillment_id/mark-as-delivered", () => {
                it("should mark a fulfillment as delivered", async () => {
                    const { order, stockLocation } = await createCompletedOrder(
                        seller1Headers,
                        product1,
                        stockLocation1
                    )

                    // Get the order with items
                    const orderResponse = await api.get(
                        `/vendor/orders/${order.id}?fields=*items`,
                        seller1Headers
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
                        seller1Headers
                    )

                    const fulfillment = fulfillmentResponse.data.fulfillment

                    // Create shipment first
                    await api.post(
                        `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/shipments`,
                        {
                            items: orderWithItems.items.map((item: any) => ({
                                id: item.id,
                                quantity: item.quantity,
                            })),
                        },
                        seller1Headers
                    )

                    // Mark as delivered
                    const deliveredResponse = await api.post(
                        `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/mark-as-delivered`,
                        {},
                        seller1Headers
                    )

                    expect(deliveredResponse.status).toEqual(200)
                    expect(deliveredResponse.data.order).toBeDefined()
                })
            })

            describe("POST /vendor/orders/:id/fulfillments/:fulfillment_id/cancel", () => {
                it("should cancel a fulfillment", async () => {
                    const { order, stockLocation } = await createCompletedOrder(
                        seller1Headers,
                        product1,
                        stockLocation1
                    )

                    // Get the order with items
                    const orderResponse = await api.get(
                        `/vendor/orders/${order.id}?fields=*items`,
                        seller1Headers
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
                        seller1Headers
                    )

                    const fulfillment = fulfillmentResponse.data.fulfillment

                    // Cancel fulfillment
                    const cancelResponse = await api.post(
                        `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/cancel`,
                        {},
                        seller1Headers
                    )

                    expect(cancelResponse.status).toEqual(200)
                    expect(cancelResponse.data.order).toBeDefined()
                })

                it("should not allow canceling fulfillment for another vendor's order", async () => {
                    const { order, stockLocation } = await createCompletedOrder(
                        seller1Headers,
                        product1,
                        stockLocation1
                    )

                    // Get the order with items
                    const orderResponse = await api.get(
                        `/vendor/orders/${order.id}?fields=*items`,
                        seller1Headers
                    )
                    const orderWithItems = orderResponse.data.order

                    // Create fulfillment as seller 1
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
                        seller1Headers
                    )

                    const fulfillment = fulfillmentResponse.data.fulfillment

                    // Seller 2 tries to cancel the fulfillment
                    const cancelResponse = await api
                        .post(
                            `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/cancel`,
                            {},
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(cancelResponse.status).toEqual(404)
                })
            })

            describe("POST /vendor/orders/:id/complete", () => {
                it("should complete an order after fulfillment and delivery", async () => {
                    const { order, stockLocation } = await createCompletedOrder(
                        seller1Headers,
                        product1,
                        stockLocation1
                    )

                    // Get the order with items
                    const orderResponse = await api.get(
                        `/vendor/orders/${order.id}?fields=*items`,
                        seller1Headers
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
                        seller1Headers
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
                        seller1Headers
                    )

                    // Mark as delivered
                    await api.post(
                        `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/mark-as-delivered`,
                        {},
                        seller1Headers
                    )

                    // Complete the order
                    const completeResponse = await api.post(
                        `/vendor/orders/${order.id}/complete`,
                        {},
                        seller1Headers
                    )

                    expect(completeResponse.status).toEqual(200)
                    expect(completeResponse.data.order).toBeDefined()
                    expect(completeResponse.data.order.status).toEqual("completed")
                })

                it("should not allow completing another vendor's order", async () => {
                    const { order } = await createCompletedOrder(seller1Headers, product1, stockLocation1)

                    const response = await api
                        .post(
                            `/vendor/orders/${order.id}/complete`,
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
