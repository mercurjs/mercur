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
        describe("Vendor - Customers", () => {
            let appContainer: MedusaContainer
            let seller1: any
            let seller1Headers: any
            let seller2: any
            let seller2Headers: any
            let customer1: any
            let customer1StoreHeaders: any
            let customer2: any
            let customer2StoreHeaders: any
            let region: any
            let salesChannel: any
            let product1: any
            let product2: any
            let shippingOption1: any
            let shippingOption2: any

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                // Create first seller
                const seller1Result = await createSellerUser(appContainer, {
                    email: "seller1@test.com",
                    name: "Test Seller 1",
                })
                seller1 = seller1Result.seller
                seller1Headers = seller1Result.headers

                // Create second seller
                const seller2Result = await createSellerUser(appContainer, {
                    email: "seller2@test.com",
                    name: "Test Seller 2",
                })
                seller2 = seller2Result.seller
                seller2Headers = seller2Result.headers

                // Create first customer
                const customer1Result = await createCustomerUser(appContainer, {
                    email: "customer1@test.com",
                    first_name: "Customer",
                    last_name: "One",
                })
                customer1 = customer1Result.customer

                // Create second customer
                const customer2Result = await createCustomerUser(appContainer, {
                    email: "customer2@test.com",
                    first_name: "Customer",
                    last_name: "Two",
                })
                customer2 = customer2Result.customer

                const apiKey = await generatePublishableKey(appContainer)
                const baseStoreHeaders = generateStoreHeaders({ publishableKey: apiKey })

                customer1StoreHeaders = {
                    headers: { ...baseStoreHeaders.headers, ...customer1Result.headers.headers }
                }
                customer2StoreHeaders = {
                    headers: { ...baseStoreHeaders.headers, ...customer2Result.headers.headers }
                }

                // Create sales channel
                const salesChannelModule = appContainer.resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "Test Store",
                })

                // Create region
                const regionModule = appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: "Test Region",
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
                        title: "Seller 1 Product",
                        description: "Product from seller 1",
                        options: [{ title: "Size", values: ["S", "M"] }],
                        variants: [
                            {
                                title: "Small",
                                sku: "SELLER1-S",
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
                        title: "Seller 2 Product",
                        description: "Product from seller 2",
                        options: [{ title: "Color", values: ["Red", "Blue"] }],
                        variants: [
                            {
                                title: "Red",
                                sku: "SELLER2-RED",
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
                const shippingPrerequisites1 = await createShippingPrerequisites(seller1Headers, "seller1")

                // Create shipping option for seller 1
                const shippingOption1Response = await api.post(
                    `/vendor/shipping-options`,
                    {
                        name: "Seller 1 Shipping",
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
                shippingOption1 = shippingOption1Response.data.shipping_option

                // Create shipping prerequisites for seller 2
                const shippingPrerequisites2 = await createShippingPrerequisites(seller2Headers, "seller2")

                // Create shipping option for seller 2
                const shippingOption2Response = await api.post(
                    `/vendor/shipping-options`,
                    {
                        name: "Seller 2 Shipping",
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
                shippingOption2 = shippingOption2Response.data.shipping_option
            })

            let prerequisiteCounter = 0

            const createShippingPrerequisites = async (headers: any, prefix: string) => {
                const uniqueSuffix = `_${prefix}_${Date.now()}_${++prerequisiteCounter}`

                // Create stock location
                const locationResponse = await api.post(
                    `/vendor/stock-locations`,
                    { name: `Warehouse${uniqueSuffix}` },
                    headers
                )
                const stockLocation = locationResponse.data.stock_location

                // Create fulfillment set
                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    {
                        name: `Fulfillment Set${uniqueSuffix}`,
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
                        name: `Service Zone${uniqueSuffix}`,
                        geo_zones: [{ type: "country", country_code: "us" }],
                    },
                    headers
                )
                const serviceZone = serviceZoneResponse.data.fulfillment_set.service_zones.find(
                    (z: any) => z.name === `Service Zone${uniqueSuffix}`
                )

                // Create shipping profile
                const shippingProfileResponse = await api.post(
                    `/vendor/shipping-profiles`,
                    {
                        name: `Shipping Profile${uniqueSuffix}`,
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

            const completeCartForCustomer = async (
                customerStoreHeaders: any,
                productVariantId: string
            ) => {
                // Create cart
                const cartResponse = await api.post(
                    `/store/carts`,
                    {
                        region_id: region.id,
                        sales_channel_id: salesChannel.id,
                        currency_code: "usd",
                    },
                    customerStoreHeaders
                )
                let cart = cartResponse.data.cart

                // Add item
                const addItemResponse = await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    {
                        variant_id: productVariantId,
                        quantity: 1,
                    },
                    customerStoreHeaders
                )
                cart = addItemResponse.data.cart

                // Get available shipping options
                const shippingOptionsResponse = await api.get(
                    `/store/shipping-options?cart_id=${cart.id}`,
                    customerStoreHeaders
                )
                const sellerShippingOptions = shippingOptionsResponse.data.shipping_options as Record<string, any[]>

                // Add shipping methods for each seller
                for (const [, options] of Object.entries(sellerShippingOptions)) {
                    if (options.length > 0) {
                        await api.post(
                            `/store/carts/${cart.id}/shipping-methods`,
                            { option_id: options[0].id },
                            customerStoreHeaders
                        )
                    }
                }

                // Create payment collection
                const paymentCollectionResponse = await api.post(
                    `/store/payment-collections`,
                    { cart_id: cart.id },
                    customerStoreHeaders
                )
                const paymentCollection = paymentCollectionResponse.data.payment_collection

                // Initialize payment session
                await api.post(
                    `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
                    { provider_id: "pp_system_default" },
                    customerStoreHeaders
                )

                // Complete cart
                const completeResponse = await api.post(
                    `/store/carts/${cart.id}/complete`,
                    {},
                    customerStoreHeaders
                )

                return completeResponse.data.order_group
            }

            describe("GET /vendor/customers", () => {
                it("should list customers who have placed orders with the vendor", async () => {
                    // Customer 1 places order with Seller 1
                    await completeCartForCustomer(customer1StoreHeaders, product1.variants[0].id)

                    // Seller 1 should see customer 1
                    const response = await api.get(
                        `/vendor/customers`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.customers).toHaveLength(1)
                    expect(response.data.customers[0]).toEqual(
                        expect.objectContaining({
                            id: customer1.id,
                            email: "customer1@test.com",
                            first_name: "Customer",
                            last_name: "One",
                        })
                    )
                })

                it("should not list customers who have not placed orders with the vendor", async () => {
                    // Customer 1 places order with Seller 1 only
                    await completeCartForCustomer(customer1StoreHeaders, product1.variants[0].id)

                    // Seller 2 should NOT see customer 1
                    const response = await api.get(
                        `/vendor/customers`,
                        seller2Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.customers).toHaveLength(0)
                })

                it("should list multiple customers who have placed orders with the vendor", async () => {
                    // Both customers place orders with Seller 1
                    await completeCartForCustomer(customer1StoreHeaders, product1.variants[0].id)
                    await completeCartForCustomer(customer2StoreHeaders, product1.variants[0].id)

                    const response = await api.get(
                        `/vendor/customers`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.customers).toHaveLength(2)
                    expect(response.data.customers.map((c: any) => c.id)).toContain(customer1.id)
                    expect(response.data.customers.map((c: any) => c.id)).toContain(customer2.id)
                })

                it("should only list unique customers even with multiple orders", async () => {
                    // Customer 1 places multiple orders with Seller 1
                    await completeCartForCustomer(customer1StoreHeaders, product1.variants[0].id)
                    await completeCartForCustomer(customer1StoreHeaders, product1.variants[0].id)

                    const response = await api.get(
                        `/vendor/customers`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.customers).toHaveLength(1)
                    expect(response.data.customers[0].id).toEqual(customer1.id)
                })

                it("each vendor should only see their own customers", async () => {
                    // Customer 1 orders from Seller 1
                    await completeCartForCustomer(customer1StoreHeaders, product1.variants[0].id)

                    // Customer 2 orders from Seller 2
                    await completeCartForCustomer(customer2StoreHeaders, product2.variants[0].id)

                    // Seller 1 should only see Customer 1
                    const seller1Response = await api.get(
                        `/vendor/customers`,
                        seller1Headers
                    )
                    expect(seller1Response.status).toEqual(200)
                    expect(seller1Response.data.customers).toHaveLength(1)
                    expect(seller1Response.data.customers[0].id).toEqual(customer1.id)

                    // Seller 2 should only see Customer 2
                    const seller2Response = await api.get(
                        `/vendor/customers`,
                        seller2Headers
                    )
                    expect(seller2Response.status).toEqual(200)
                    expect(seller2Response.data.customers).toHaveLength(1)
                    expect(seller2Response.data.customers[0].id).toEqual(customer2.id)
                })
            })

            describe("GET /vendor/customers/:id", () => {
                it("should get a customer by id if they have placed an order with the vendor", async () => {
                    // Customer 1 places order with Seller 1
                    await completeCartForCustomer(customer1StoreHeaders, product1.variants[0].id)

                    const response = await api.get(
                        `/vendor/customers/${customer1.id}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.customer).toEqual(
                        expect.objectContaining({
                            id: customer1.id,
                            email: "customer1@test.com",
                            first_name: "Customer",
                            last_name: "One",
                        })
                    )
                })

                it("should return 404 for customer who has not ordered from the vendor", async () => {
                    // Customer 1 places order with Seller 1 only
                    await completeCartForCustomer(customer1StoreHeaders, product1.variants[0].id)

                    // Seller 2 tries to get Customer 1
                    const response = await api
                        .get(`/vendor/customers/${customer1.id}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for non-existent customer", async () => {
                    const response = await api
                        .get(`/vendor/customers/non-existent-id`, seller1Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
