import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
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

                // Link payment provider to region
                const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
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

                    // Get shipping options for cart (grouped by seller)
                    const shippingOptionsResponse = await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders
                    )

                    expect(shippingOptionsResponse.status).toEqual(200)

                    // Flatten shipping options from seller map
                    const allShippingOptions = Object.values(
                        shippingOptionsResponse.data.shipping_options as Record<string, any[]>
                    ).flat()

                    if (allShippingOptions.length > 0) {
                        // Add shipping method
                        const addShippingResponse = await api.post(
                            `/store/carts/${cart.id}/shipping-methods`,
                            {
                                option_id: allShippingOptions[0].id,
                            },
                            storeHeaders
                        )

                        expect(addShippingResponse.status).toEqual(200)
                        expect(addShippingResponse.data.cart.shipping_methods).toBeDefined()
                    }
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

                    // 4. Get available shipping options (grouped by seller)
                    const shippingOptionsResponse = await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders
                    )

                    // Flatten shipping options from seller map
                    const allShippingOptions = Object.values(
                        shippingOptionsResponse.data.shipping_options as Record<string, any[]>
                    ).flat()

                    // 5. Add shipping method if available
                    if (allShippingOptions.length > 0) {
                        const addShippingResponse = await api.post(
                            `/store/carts/${cart.id}/shipping-methods`,
                            {
                                option_id: allShippingOptions[0].id,
                            },
                            storeHeaders
                        )
                        cart = addShippingResponse.data.cart
                        expect(cart.shipping_methods?.length).toBeGreaterThan(0)
                    }

                    // 6. Create payment collection for the cart
                    const paymentCollectionResponse = await api.post(
                        `/store/payment-collections`,
                        { cart_id: cart.id },
                        storeHeaders
                    )

                    const paymentCollection = paymentCollectionResponse.data.payment_collection
                    // 7. Initialize payment session
                    await api.post(
                        `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
                        {
                            provider_id: "pp_system_default",
                        },
                        storeHeaders
                    )

                    // 8. Complete the cart using complete endpoint
                    const completeResponse = await api.post(
                        `/store/carts/${cart.id}/complete`,
                        {},
                        storeHeaders
                    )

                    expect(completeResponse.status).toEqual(200)
                    expect(completeResponse.data.type).toEqual("order_group")
                    expect(completeResponse.data.order_group).toBeDefined()
                    expect(completeResponse.data.order_group.id).toBeDefined()
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

            describe("Promotions/Discounts", () => {
                it("should apply seller promotion only to that seller's items", async () => {
                    // Create promotion for seller (10% off order)
                    const promotionResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "SELLER10",
                            type: "standard",
                            status: "active",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        sellerHeaders
                    )
                    expect(promotionResponse.status).toEqual(200)

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
                    let cart = cartResponse.data.cart

                    // Add item to cart (item price: $20.00)
                    const addItemResponse = await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )
                    cart = addItemResponse.data.cart

                    // Apply promotion
                    const promoResponse = await api.post(
                        `/store/carts/${cart.id}/promotions`,
                        {
                            promo_codes: ["SELLER10"],
                        },
                        storeHeaders
                    )

                    expect(promoResponse.status).toEqual(200)
                    cart = promoResponse.data.cart

                    // Verify discount was applied
                    expect(cart.items[0].adjustments).toBeDefined()
                    expect(cart.items[0].adjustments.length).toBeGreaterThan(0)
                    expect(cart.items[0].adjustments[0].code).toEqual("SELLER10")
                    expect(cart.items[0].adjustments[0].amount).toBeGreaterThan(0)
                })

                it("should only apply seller promotion to that seller's items when cart has multiple sellers", async () => {
                    // Create second seller with product
                    const seller2Result = await createSellerUser(appContainer, {
                        email: "seller2promo@test.com",
                        name: "Promo Seller 2",
                    })
                    const seller2Headers = seller2Result.headers

                    // Create product for seller 2
                    const product2Response = await api.post(
                        `/vendor/products`,
                        {
                            status: "published",
                            title: "Seller 2 Product",
                            options: [{ title: "Size", values: ["M"] }],
                            variants: [
                                {
                                    title: "Medium",
                                    sku: "S2-M",
                                    options: { Size: "M" },
                                    prices: [{ currency_code: "usd", amount: 3000 }],
                                    manage_inventory: false,
                                },
                            ],
                            sales_channels: [{ id: salesChannel.id }],
                        },
                        seller2Headers
                    )
                    const product2 = product2Response.data.product

                    // Create promotion for seller 1 only (20% off order)
                    await api.post(
                        `/vendor/promotions`,
                        {
                            code: "SELLER1ONLY",
                            type: "standard",
                            status: "active",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 20,
                            },
                        },
                        sellerHeaders
                    )

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

                    // Add item from seller 1 ($20.00)
                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    // Add item from seller 2 ($30.00)
                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product2.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    // Apply seller 1's promotion
                    const promoResponse = await api.post(
                        `/store/carts/${cart.id}/promotions`,
                        {
                            promo_codes: ["SELLER1ONLY"],
                        },
                        storeHeaders
                    )

                    expect(promoResponse.status).toEqual(200)
                    cart = promoResponse.data.cart

                    // Find seller 1's item and seller 2's item
                    const seller1Item = cart.items.find((item: any) => item.variant_id === product.variants[0].id)
                    const seller2Item = cart.items.find((item: any) => item.variant_id === product2.variants[0].id)

                    // Seller 1's item should have the discount
                    const seller1Adjustment = seller1Item.adjustments?.find(
                        (adj: any) => adj.code === "SELLER1ONLY"
                    )
                    expect(seller1Adjustment).toBeDefined()
                    expect(seller1Adjustment.amount).toBeGreaterThan(0)

                    // Seller 2's item should NOT have any discount adjustments from seller 1's promotion
                    const seller2Adjustments = seller2Item.adjustments?.filter(
                        (adj: any) => adj.code === "SELLER1ONLY"
                    ) || []
                    expect(seller2Adjustments.length).toEqual(0)
                })

                it("should apply different seller promotions to their respective items", async () => {
                    // Create second seller with product
                    const seller2Result = await createSellerUser(appContainer, {
                        email: "seller2multi@test.com",
                        name: "Multi Promo Seller 2",
                    })
                    const seller2Headers = seller2Result.headers

                    // Create product for seller 2
                    const product2Response = await api.post(
                        `/vendor/products`,
                        {
                            status: "published",
                            title: "Seller 2 Multi Product",
                            options: [{ title: "Size", values: ["L"] }],
                            variants: [
                                {
                                    title: "Large",
                                    sku: "S2-L-MULTI",
                                    options: { Size: "L" },
                                    prices: [{ currency_code: "usd", amount: 5000 }],
                                    manage_inventory: false,
                                },
                            ],
                            sales_channels: [{ id: salesChannel.id }],
                        },
                        seller2Headers
                    )
                    const product2 = product2Response.data.product

                    // Create promotion for seller 1 (10% off)
                    await api.post(
                        `/vendor/promotions`,
                        {
                            code: "SELLER1TEN",
                            type: "standard",
                            status: "active",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        sellerHeaders
                    )

                    // Create promotion for seller 2 (15% off)
                    await api.post(
                        `/vendor/promotions`,
                        {
                            code: "SELLER2FIFTEEN",
                            type: "standard",
                            status: "active",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 15,
                            },
                        },
                        seller2Headers
                    )

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

                    // Add item from seller 1 ($20.00)
                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    // Add item from seller 2 ($50.00)
                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product2.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    // Apply both promotions
                    await api.post(
                        `/store/carts/${cart.id}/promotions`,
                        {
                            promo_codes: ["SELLER1TEN"],
                        },
                        storeHeaders
                    )

                    const promoResponse = await api.post(
                        `/store/carts/${cart.id}/promotions`,
                        {
                            promo_codes: ["SELLER2FIFTEEN"],
                        },
                        storeHeaders
                    )

                    expect(promoResponse.status).toEqual(200)
                    cart = promoResponse.data.cart

                    // Find items
                    const seller1Item = cart.items.find((item: any) => item.variant_id === product.variants[0].id)
                    const seller2Item = cart.items.find((item: any) => item.variant_id === product2.variants[0].id)

                    // Seller 1's item should have SELLER1TEN discount
                    const seller1Adjustment = seller1Item.adjustments?.find(
                        (adj: any) => adj.code === "SELLER1TEN"
                    )
                    expect(seller1Adjustment).toBeDefined()
                    expect(seller1Adjustment.amount).toBeGreaterThan(0)

                    // Seller 2's item should have SELLER2FIFTEEN discount
                    const seller2Adjustment = seller2Item.adjustments?.find(
                        (adj: any) => adj.code === "SELLER2FIFTEEN"
                    )
                    expect(seller2Adjustment).toBeDefined()
                    expect(seller2Adjustment.amount).toBeGreaterThan(0)

                    // Verify cross-seller promotions are not applied
                    const seller1WrongAdjustment = seller1Item.adjustments?.find(
                        (adj: any) => adj.code === "SELLER2FIFTEEN"
                    )
                    const seller2WrongAdjustment = seller2Item.adjustments?.find(
                        (adj: any) => adj.code === "SELLER1TEN"
                    )
                    expect(seller1WrongAdjustment).toBeUndefined()
                    expect(seller2WrongAdjustment).toBeUndefined()
                })
            })

            describe("Shipping Options", () => {
                it("should return shipping options grouped by seller", async () => {
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

                    // Add item to cart
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
                            email: "shipping@test.com",
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

                    // Get shipping options
                    const shippingOptionsResponse = await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders
                    )

                    expect(shippingOptionsResponse.status).toEqual(200)
                    expect(shippingOptionsResponse.data.shipping_options).toBeDefined()

                    // Verify response is a map with seller IDs as keys
                    const shippingOptions = shippingOptionsResponse.data.shipping_options
                    expect(typeof shippingOptions).toBe("object")

                    // Verify the seller has shipping options
                    expect(shippingOptions[seller.id]).toBeDefined()
                    expect(Array.isArray(shippingOptions[seller.id])).toBe(true)
                    expect(shippingOptions[seller.id].length).toBeGreaterThan(0)
                })

                it("should return correct shipping option details for seller", async () => {
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

                    // Add item to cart
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
                            email: "shipping@test.com",
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

                    // Get shipping options
                    const shippingOptionsResponse = await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders
                    )

                    const sellerShippingOptions = shippingOptionsResponse.data.shipping_options[seller.id]
                    expect(sellerShippingOptions).toBeDefined()

                    // Find our created shipping option
                    const foundOption = sellerShippingOptions.find(
                        (opt: any) => opt.id === shippingOption.id
                    )
                    expect(foundOption).toBeDefined()
                    expect(foundOption.name).toEqual("Standard Shipping")
                    expect(foundOption.price_type).toEqual("flat")
                    expect(foundOption.amount).toBeDefined()
                })

                it("should return shipping options for multiple sellers when cart has items from different vendors", async () => {
                    // Create a second seller with product and shipping
                    const seller2Result = await createSellerUser(appContainer, {
                        email: "seller2@test.com",
                        name: "Test Seller 2",
                    })
                    const seller2 = seller2Result.seller
                    const seller2Headers = seller2Result.headers

                    // Create product for seller 2
                    const product2Response = await api.post(
                        `/vendor/products`,
                        {
                            status: 'published',
                            title: "Seller 2 Product",
                            description: "Product from seller 2",
                            options: [{ title: "Color", values: ["Red"] }],
                            variants: [
                                {
                                    title: "Red",
                                    sku: "S2-RED",
                                    options: { Color: "Red" },
                                    prices: [{ currency_code: "usd", amount: 3000 }],
                                    manage_inventory: false,
                                },
                            ],
                            sales_channels: [{ id: salesChannel.id }],
                        },
                        seller2Headers
                    )
                    const product2 = product2Response.data.product

                    // Create shipping prerequisites for seller 2
                    const shippingPrerequisites2 = await createShippingPrerequisites(seller2Headers)

                    // Create shipping option for seller 2
                    await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: "Seller 2 Express Shipping",
                            service_zone_id: shippingPrerequisites2.serviceZone.id,
                            shipping_profile_id: shippingPrerequisites2.shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "flat",
                            type: {
                                label: "Express",
                                description: "Express shipping",
                                code: "express",
                            },
                            prices: [{ currency_code: "usd", amount: 1000 }],
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

                    // Add item from seller 1
                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    // Add item from seller 2
                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product2.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    // Update cart with shipping address
                    await api.post(
                        `/store/carts/${cart.id}`,
                        {
                            email: "multiseller@test.com",
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

                    // Get shipping options
                    const shippingOptionsResponse = await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders
                    )

                    expect(shippingOptionsResponse.status).toEqual(200)

                    const shippingOptions = shippingOptionsResponse.data.shipping_options

                    // Verify both sellers have shipping options
                    expect(shippingOptions[seller.id]).toBeDefined()
                    expect(shippingOptions[seller2.id]).toBeDefined()

                    // Verify seller 1 has their shipping option
                    expect(shippingOptions[seller.id].length).toBeGreaterThan(0)
                    const seller1Option = shippingOptions[seller.id].find(
                        (opt: any) => opt.name === "Standard Shipping"
                    )
                    expect(seller1Option).toBeDefined()

                    // Verify seller 2 has their shipping option
                    expect(shippingOptions[seller2.id].length).toBeGreaterThan(0)
                    const seller2Option = shippingOptions[seller2.id].find(
                        (opt: any) => opt.name === "Seller 2 Express Shipping"
                    )
                    expect(seller2Option).toBeDefined()
                })

                it("should only return shipping options for sellers with items in cart", async () => {
                    // Create a second seller with shipping but no items in cart
                    const seller2Result = await createSellerUser(appContainer, {
                        email: "seller3@test.com",
                        name: "Test Seller 3",
                    })
                    const seller2Headers = seller2Result.headers

                    // Create shipping prerequisites for seller 2 (but don't add products to cart)
                    const shippingPrerequisites2 = await createShippingPrerequisites(seller2Headers)

                    // Create shipping option for seller 2
                    await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: "Seller 3 Shipping",
                            service_zone_id: shippingPrerequisites2.serviceZone.id,
                            shipping_profile_id: shippingPrerequisites2.shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "flat",
                            type: {
                                label: "Standard",
                                description: "Standard shipping",
                                code: "standard",
                            },
                            prices: [{ currency_code: "usd", amount: 700 }],
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

                    // Create cart with only seller 1's item
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

                    // Add item from seller 1 only
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
                            email: "singleseller@test.com",
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

                    // Get shipping options
                    const shippingOptionsResponse = await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders
                    )

                    expect(shippingOptionsResponse.status).toEqual(200)

                    const shippingOptions = shippingOptionsResponse.data.shipping_options

                    // Verify only seller 1 has shipping options (seller 3 has no items in cart)
                    expect(shippingOptions[seller.id]).toBeDefined()
                    expect(Object.keys(shippingOptions)).toHaveLength(1)
                })

                it("should include calculated price in shipping options", async () => {
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

                    // Add item to cart
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
                            email: "pricing@test.com",
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

                    // Get shipping options
                    const shippingOptionsResponse = await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders
                    )

                    const sellerShippingOptions = shippingOptionsResponse.data.shipping_options[seller.id]
                    expect(sellerShippingOptions).toBeDefined()
                    expect(sellerShippingOptions.length).toBeGreaterThan(0)

                    // Verify price is calculated
                    const option = sellerShippingOptions[0]
                    expect(option.amount).toBeDefined()
                    expect(typeof option.amount).toBe("number")
                    expect(option.amount).toEqual(500) // The price we set for Standard Shipping
                })
            })

            describe("Shipping Methods", () => {
                it("should add a shipping method to cart", async () => {
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
                    let cart = cartResponse.data.cart

                    // Add item to cart
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
                            email: "shipping-method@test.com",
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

                    // Get shipping options
                    const shippingOptionsResponse = await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders
                    )

                    const sellerShippingOptions = shippingOptionsResponse.data.shipping_options[seller.id]
                    expect(sellerShippingOptions.length).toBeGreaterThan(0)

                    // Add shipping method
                    const addShippingResponse = await api.post(
                        `/store/carts/${cart.id}/shipping-methods`,
                        {
                            option_id: sellerShippingOptions[0].id,
                        },
                        storeHeaders
                    )

                    expect(addShippingResponse.status).toEqual(200)
                    cart = addShippingResponse.data.cart
                    expect(cart.shipping_methods).toBeDefined()
                    expect(cart.shipping_methods.length).toEqual(1)
                    expect(cart.shipping_methods[0].shipping_option_id).toEqual(sellerShippingOptions[0].id)
                })

                it("should replace seller's shipping method when adding a new one for the same seller", async () => {
                    // Create a second shipping option for the same seller
                    const shippingPrerequisites = await createShippingPrerequisites(sellerHeaders)
                    const secondShippingOptionResponse = await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: "Express Shipping",
                            service_zone_id: shippingPrerequisites.serviceZone.id,
                            shipping_profile_id: shippingPrerequisites.shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "flat",
                            type: {
                                label: "Express",
                                description: "Express shipping",
                                code: "express",
                            },
                            prices: [{ currency_code: "usd", amount: 1500 }],
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
                    const secondShippingOption = secondShippingOptionResponse.data.shipping_option

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
                    let cart = cartResponse.data.cart

                    // Add item to cart
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
                            email: "replace-shipping@test.com",
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

                    // Add first shipping method (Standard Shipping)
                    const addFirstResponse = await api.post(
                        `/store/carts/${cart.id}/shipping-methods`,
                        {
                            option_id: shippingOption.id,
                        },
                        storeHeaders
                    )
                    cart = addFirstResponse.data.cart
                    expect(cart.shipping_methods.length).toEqual(1)
                    expect(cart.shipping_methods[0].shipping_option_id).toEqual(shippingOption.id)

                    // Add second shipping method (Express Shipping) - should replace the first one
                    const addSecondResponse = await api.post(
                        `/store/carts/${cart.id}/shipping-methods`,
                        {
                            option_id: secondShippingOption.id,
                        },
                        storeHeaders
                    )
                    cart = addSecondResponse.data.cart

                    // Verify only the new shipping method exists (previous one removed)
                    expect(cart.shipping_methods.length).toEqual(1)
                    expect(cart.shipping_methods[0].shipping_option_id).toEqual(secondShippingOption.id)
                })

                it("should preserve other seller's shipping methods when adding shipping method for one seller", async () => {
                    // Create a second seller with product and shipping
                    const seller2Result = await createSellerUser(appContainer, {
                        email: "seller2-shipping-method@test.com",
                        name: "Shipping Method Seller 2",
                    })
                    const seller2 = seller2Result.seller
                    const seller2Headers = seller2Result.headers

                    // Create product for seller 2
                    const product2Response = await api.post(
                        `/vendor/products`,
                        {
                            status: 'published',
                            title: "Seller 2 Shipping Product",
                            options: [{ title: "Size", values: ["M"] }],
                            variants: [
                                {
                                    title: "Medium",
                                    sku: "S2-SHIP-M",
                                    options: { Size: "M" },
                                    prices: [{ currency_code: "usd", amount: 3000 }],
                                    manage_inventory: false,
                                },
                            ],
                            sales_channels: [{ id: salesChannel.id }],
                        },
                        seller2Headers
                    )
                    const product2 = product2Response.data.product

                    // Create shipping prerequisites for seller 2
                    const shippingPrerequisites2 = await createShippingPrerequisites(seller2Headers)

                    // Create shipping option for seller 2
                    const seller2ShippingResponse = await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: "Seller 2 Standard Shipping",
                            service_zone_id: shippingPrerequisites2.serviceZone.id,
                            shipping_profile_id: shippingPrerequisites2.shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "flat",
                            type: {
                                label: "Standard",
                                description: "Standard shipping",
                                code: "standard",
                            },
                            prices: [{ currency_code: "usd", amount: 800 }],
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
                    const seller2ShippingOption = seller2ShippingResponse.data.shipping_option

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

                    // Add item from seller 1
                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    // Add item from seller 2
                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product2.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    // Update cart with shipping address
                    await api.post(
                        `/store/carts/${cart.id}`,
                        {
                            email: "multi-seller-shipping@test.com",
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

                    // Add shipping method for seller 1
                    const addSeller1Response = await api.post(
                        `/store/carts/${cart.id}/shipping-methods`,
                        {
                            option_id: shippingOption.id,
                        },
                        storeHeaders
                    )
                    cart = addSeller1Response.data.cart
                    expect(cart.shipping_methods.length).toEqual(1)

                    // Add shipping method for seller 2
                    const addSeller2Response = await api.post(
                        `/store/carts/${cart.id}/shipping-methods`,
                        {
                            option_id: seller2ShippingOption.id,
                        },
                        storeHeaders
                    )
                    cart = addSeller2Response.data.cart

                    // Verify both shipping methods exist
                    expect(cart.shipping_methods.length).toEqual(2)

                    const seller1Method = cart.shipping_methods.find(
                        (sm: any) => sm.shipping_option_id === shippingOption.id
                    )
                    const seller2Method = cart.shipping_methods.find(
                        (sm: any) => sm.shipping_option_id === seller2ShippingOption.id
                    )

                    expect(seller1Method).toBeDefined()
                    expect(seller2Method).toBeDefined()
                })

                it("should only remove the specific seller's shipping method when updating, not others", async () => {
                    // Create a second seller with product and shipping
                    const seller2Result = await createSellerUser(appContainer, {
                        email: "seller2-replace@test.com",
                        name: "Replace Shipping Seller 2",
                    })
                    const seller2Headers = seller2Result.headers

                    // Create product for seller 2
                    const product2Response = await api.post(
                        `/vendor/products`,
                        {
                            status: 'published',
                            title: "Seller 2 Replace Product",
                            options: [{ title: "Size", values: ["L"] }],
                            variants: [
                                {
                                    title: "Large",
                                    sku: "S2-REPLACE-L",
                                    options: { Size: "L" },
                                    prices: [{ currency_code: "usd", amount: 4000 }],
                                    manage_inventory: false,
                                },
                            ],
                            sales_channels: [{ id: salesChannel.id }],
                        },
                        seller2Headers
                    )
                    const product2 = product2Response.data.product

                    // Create shipping prerequisites for seller 2
                    const shippingPrerequisites2 = await createShippingPrerequisites(seller2Headers)

                    // Create shipping option for seller 2
                    const seller2ShippingResponse = await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: "Seller 2 Replace Shipping",
                            service_zone_id: shippingPrerequisites2.serviceZone.id,
                            shipping_profile_id: shippingPrerequisites2.shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "flat",
                            type: {
                                label: "Standard",
                                description: "Standard shipping",
                                code: "standard",
                            },
                            prices: [{ currency_code: "usd", amount: 900 }],
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
                    const seller2ShippingOption = seller2ShippingResponse.data.shipping_option

                    // Create a second shipping option for seller 1 (to replace the first one)
                    const seller1Prereqs = await createShippingPrerequisites(sellerHeaders)
                    const seller1SecondShippingResponse = await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: "Seller 1 Express Shipping",
                            service_zone_id: seller1Prereqs.serviceZone.id,
                            shipping_profile_id: seller1Prereqs.shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "flat",
                            type: {
                                label: "Express",
                                description: "Express shipping",
                                code: "express",
                            },
                            prices: [{ currency_code: "usd", amount: 1200 }],
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
                    const seller1ExpressOption = seller1SecondShippingResponse.data.shipping_option

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

                    // Add items from both sellers
                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            variant_id: product2.variants[0].id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    // Update cart with shipping address
                    await api.post(
                        `/store/carts/${cart.id}`,
                        {
                            email: "selective-replace@test.com",
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

                    // Add shipping method for seller 1 (Standard)
                    await api.post(
                        `/store/carts/${cart.id}/shipping-methods`,
                        {
                            option_id: shippingOption.id,
                        },
                        storeHeaders
                    )

                    // Add shipping method for seller 2
                    const addSeller2Response = await api.post(
                        `/store/carts/${cart.id}/shipping-methods`,
                        {
                            option_id: seller2ShippingOption.id,
                        },
                        storeHeaders
                    )
                    cart = addSeller2Response.data.cart
                    expect(cart.shipping_methods.length).toEqual(2)

                    // Now replace seller 1's shipping method with Express
                    const replaceResponse = await api.post(
                        `/store/carts/${cart.id}/shipping-methods`,
                        {
                            option_id: seller1ExpressOption.id,
                        },
                        storeHeaders
                    )
                    cart = replaceResponse.data.cart

                    // Verify: still 2 shipping methods
                    expect(cart.shipping_methods.length).toEqual(2)

                    // Seller 1 should now have Express (not Standard)
                    const seller1Method = cart.shipping_methods.find(
                        (sm: any) => sm.shipping_option_id === seller1ExpressOption.id
                    )
                    expect(seller1Method).toBeDefined()

                    // Seller 1's Standard shipping should be gone
                    const seller1StandardMethod = cart.shipping_methods.find(
                        (sm: any) => sm.shipping_option_id === shippingOption.id
                    )
                    expect(seller1StandardMethod).toBeUndefined()

                    // Seller 2's shipping method should still be there
                    const seller2Method = cart.shipping_methods.find(
                        (sm: any) => sm.shipping_option_id === seller2ShippingOption.id
                    )
                    expect(seller2Method).toBeDefined()
                })
            })
        })
    },
})
