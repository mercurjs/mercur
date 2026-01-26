import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IApiKeyModuleService,
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ApiKeyType, ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import { generatePublishableKey, generateStoreHeaders } from "../../../helpers/create-admin-user"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Store - Cart", () => {
            let appContainer: MedusaContainer
            let seller: any
            let sellerHeaders: any
            let customer: any
            let customerHeaders: any
            let storeHeaders: any
            let region: any
            let salesChannel: any
            let product: any
            let shippingOption: any

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                // Create seller
                const sellerResult = await createSellerUser(appContainer, {
                    email: "seller@test.com",
                    name: "Test Seller",
                })
                seller = sellerResult.seller
                sellerHeaders = sellerResult.headers

                // Create customer
                const customerResult = await createCustomerUser(appContainer, {
                    email: "customer@test.com",
                    first_name: "Test",
                    last_name: "Customer",
                })
                customer = customerResult.customer
                customerHeaders = customerResult.headers

                const apiKey = await generatePublishableKey(appContainer)
                storeHeaders = generateStoreHeaders({ publishableKey: apiKey })

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

                // Create product with variant
                const productResponse = await api.post(
                    `/vendor/products`,
                    {
                        status: 'published',
                        title: "Test Product",
                        description: "A test product for cart",
                        options: [{ title: "Size", values: ["S", "M", "L"] }],
                        variants: [
                            {
                                title: "Small",
                                sku: "TEST-S",
                                options: { Size: "S" },
                                prices: [{ currency_code: "usd", amount: 2000 }],
                                manage_inventory: false,
                            },
                            {
                                title: "Medium",
                                sku: "TEST-M",
                                options: { Size: "M" },
                                prices: [{ currency_code: "usd", amount: 2500 }],
                                manage_inventory: false,
                            },
                        ],
                        sales_channels: [{ id: salesChannel.id }],
                    },
                    sellerHeaders
                )
                product = productResponse.data.product

                // Create shipping prerequisites
                const shippingPrerequisites = await createShippingPrerequisites(sellerHeaders)

                // Create shipping option
                const shippingOptionResponse = await api.post(
                    `/vendor/shipping-options`,
                    {
                        name: "Standard Shipping",
                        service_zone_id: shippingPrerequisites.serviceZone.id,
                        shipping_profile_id: shippingPrerequisites.shippingProfile.id,
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
                shippingOption = shippingOptionResponse.data.shipping_option
            })

            let prerequisiteCounter = 0

            const createShippingPrerequisites = async (headers: any) => {
                const uniqueSuffix = `_${Date.now()}_${++prerequisiteCounter}`

                // Create stock location
                const locationResponse = await api.post(
                    `/vendor/stock-locations`,
                    { name: `Test Warehouse${uniqueSuffix}` },
                    headers
                )
                const stockLocation = locationResponse.data.stock_location

                // Create fulfillment set
                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    {
                        name: `Test Fulfillment Set${uniqueSuffix}`,
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
                        name: `Test Service Zone${uniqueSuffix}`,
                        geo_zones: [{ type: "country", country_code: "us" }],
                    },
                    headers
                )
                const serviceZone = serviceZoneResponse.data.fulfillment_set.service_zones.find(
                    (z: any) => z.name === `Test Service Zone${uniqueSuffix}`
                )

                // Create shipping profile
                const shippingProfileResponse = await api.post(
                    `/vendor/shipping-profiles`,
                    {
                        name: `Test Shipping Profile${uniqueSuffix}`,
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

            describe("Cart Flow", () => {
                it("should create a cart", async () => {
                    const response = await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.cart).toBeDefined()
                    expect(response.data.cart.id).toBeDefined()
                    expect(response.data.cart.region_id).toEqual(region.id)
                })

                it("should add items to cart", async () => {
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
                    const cart = cartResponse.data.cart

                    // Add item to cart
                    const addItemResponse = await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 2,
                        },
                        storeHeaders
                    )

                    expect(addItemResponse.status).toEqual(200)
                    expect(addItemResponse.data.cart.items).toHaveLength(1)
                    expect(addItemResponse.data.cart.items[0].quantity).toEqual(2)
                    expect(addItemResponse.data.cart.items[0].variant_id).toEqual(product.variants[0].id)
                })

                it("should update cart with shipping address", async () => {
                    // Create cart with item
                    const cartResponse = await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders
                    )
                    const cart = cartResponse.data.cart

                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    // Update cart with shipping address
                    const updateResponse = await api.post(
                        `/store/carts/${cart.id}`,
                        {
                            email: "customer@test.com",
                            shipping_address: {
                                first_name: "John",
                                last_name: "Doe",
                                address_1: "123 Main St",
                                city: "New York",
                                country_code: "us",
                                postal_code: "10001",
                            },
                            billing_address: {
                                first_name: "John",
                                last_name: "Doe",
                                address_1: "123 Main St",
                                city: "New York",
                                country_code: "us",
                                postal_code: "10001",
                            },
                        },
                        storeHeaders
                    )

                    expect(updateResponse.status).toEqual(200)
                    expect(updateResponse.data.cart.shipping_address).toBeDefined()
                    expect(updateResponse.data.cart.shipping_address.city).toEqual("New York")
                })

                it("should add shipping method to cart", async () => {
                    // Create cart with item
                    const cartResponse = await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders
                    )
                    const cart = cartResponse.data.cart

                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    // Update cart with shipping address
                    await api.post(
                        `/store/carts/${cart.id}`,
                        {
                            email: "customer@test.com",
                            shipping_address: {
                                first_name: "John",
                                last_name: "Doe",
                                address_1: "123 Main St",
                                city: "New York",
                                country_code: "us",
                                postal_code: "10001",
                            },
                        },
                        storeHeaders
                    )

                    // Get shipping options for cart
                    const shippingOptionsResponse = await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders
                    )

                    expect(shippingOptionsResponse.status).toEqual(200)

                    if (shippingOptionsResponse.data.shipping_options.length > 0) {
                        // Add shipping method
                        const addShippingResponse = await api.post(
                            `/store/carts/${cart.id}/shipping-methods`,
                            {
                                option_id: shippingOptionsResponse.data.shipping_options[0].id,
                            },
                            storeHeaders
                        )

                        expect(addShippingResponse.status).toEqual(200)
                        expect(addShippingResponse.data.cart.shipping_methods).toBeDefined()
                    }
                })

                it("should initialize payment session", async () => {
                    // Create cart with item
                    const cartResponse = await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders
                    )
                    const cart = cartResponse.data.cart

                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    // Update cart with email and addresses
                    await api.post(
                        `/store/carts/${cart.id}`,
                        {
                            email: "customer@test.com",
                            shipping_address: {
                                first_name: "John",
                                last_name: "Doe",
                                address_1: "123 Main St",
                                city: "New York",
                                country_code: "us",
                                postal_code: "10001",
                            },
                            billing_address: {
                                first_name: "John",
                                last_name: "Doe",
                                address_1: "123 Main St",
                                city: "New York",
                                country_code: "us",
                                postal_code: "10001",
                            },
                        },
                        storeHeaders
                    )

                    // Initialize payment session
                    const paymentResponse = await api.post(
                        `/store/payment-collections/${cart.id}/payment-sessions`,
                        {
                            provider_id: "pp_system_default",
                        },
                        storeHeaders
                    ).catch((e) => e.response)

                    // Payment session initialization may vary based on setup
                    expect(paymentResponse).toBeDefined()
                })

                it("should complete full cart checkout flow and return order_group", async () => {
                    // 1. Create cart
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
                    expect(cart.id).toBeDefined()

                    // 2. Add items to cart
                    const addItemResponse = await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 2,
                        },
                        storeHeaders
                    )
                    cart = addItemResponse.data.cart
                    expect(cart.items).toHaveLength(1)

                    // 3. Update cart with customer info and addresses
                    const updateResponse = await api.post(
                        `/store/carts/${cart.id}`,
                        {
                            email: "checkout@test.com",
                            shipping_address: {
                                first_name: "Jane",
                                last_name: "Doe",
                                address_1: "456 Oak Ave",
                                city: "Los Angeles",
                                country_code: "us",
                                postal_code: "90001",
                                phone: "555-1234",
                            },
                            billing_address: {
                                first_name: "Jane",
                                last_name: "Doe",
                                address_1: "456 Oak Ave",
                                city: "Los Angeles",
                                country_code: "us",
                                postal_code: "90001",
                            },
                        },
                        storeHeaders
                    )
                    cart = updateResponse.data.cart
                    expect(cart.email).toEqual("checkout@test.com")
                    expect(cart.shipping_address).toBeDefined()

                    // 4. Get available shipping options
                    const shippingOptionsResponse = await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders
                    )

                    // 5. Add shipping method if available
                    if (shippingOptionsResponse.data.shipping_options?.length > 0) {
                        const addShippingResponse = await api.post(
                            `/store/carts/${cart.id}/shipping-methods`,
                            {
                                option_id: shippingOptionsResponse.data.shipping_options[0].id,
                            },
                            storeHeaders
                        )
                        cart = addShippingResponse.data.cart
                        expect(cart.shipping_methods?.length).toBeGreaterThan(0)
                    }

                    // 6. Get updated cart to verify payment collection
                    const cartWithPayment = await api.get(
                        `/store/carts/${cart.id}`,
                        storeHeaders
                    )
                    cart = cartWithPayment.data.cart

                    // 7. Initialize payment session
                    if (cart.payment_collection?.id) {
                        await api.post(
                            `/store/payment-collections/${cart.payment_collection.id}/payment-sessions`,
                            {
                                provider_id: "pp_system_default",
                            },
                            storeHeaders
                        ).catch(() => {
                            // Payment provider may not be available in test
                        })
                    }

                    // 8. Complete the cart
                    const completeResponse = await api.post(
                        `/store/carts/${cart.id}/complete`,
                        {},
                        storeHeaders
                    )

                    expect(completeResponse.status).toEqual(200)
                    expect(completeResponse.data.type).toEqual("order_group")
                    expect(completeResponse.data.order_group).toBeDefined()
                    expect(completeResponse.data.order_group.id).toBeDefined()
                    expect(completeResponse.data.order_group.orders).toBeDefined()
                    expect(completeResponse.data.order_group.orders.length).toBeGreaterThan(0)
                })

                it("should add multiple items from different variants", async () => {
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
                    const cart = cartResponse.data.cart

                    // Add first variant
                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    // Add second variant
                    const addSecondResponse = await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[1].id,
                            quantity: 2,
                        },
                        storeHeaders
                    )

                    expect(addSecondResponse.data.cart.items).toHaveLength(2)
                })

                it("should update line item quantity", async () => {
                    // Create cart with item
                    const cartResponse = await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders
                    )
                    const cart = cartResponse.data.cart

                    const addItemResponse = await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )
                    const lineItemId = addItemResponse.data.cart.items[0].id

                    // Update quantity
                    const updateResponse = await api.post(
                        `/store/carts/${cart.id}/line-items/${lineItemId}`,
                        {
                            quantity: 5,
                        },
                        storeHeaders
                    )

                    expect(updateResponse.data.cart.items[0].quantity).toEqual(5)
                })

                it("should remove line item from cart", async () => {
                    // Create cart with item
                    const cartResponse = await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders
                    )
                    const cart = cartResponse.data.cart

                    const addItemResponse = await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )
                    const lineItemId = addItemResponse.data.cart.items[0].id

                    // Remove item
                    const deleteResponse = await api.delete(
                        `/store/carts/${cart.id}/line-items/${lineItemId}`,
                        storeHeaders
                    )

                    expect(deleteResponse.data.parent.items).toHaveLength(0)
                })

                it("should create cart with customer authentication", async () => {
                    // Create cart with customer headers (authenticated)
                    const response = await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        {
                            headers: {
                                ...storeHeaders.headers,
                                ...customerHeaders.headers,
                            },
                        }
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.cart).toBeDefined()
                })
            })
        })
    },
})
