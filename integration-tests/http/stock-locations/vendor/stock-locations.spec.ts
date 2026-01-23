import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Stock Locations", () => {
            let appContainer: MedusaContainer
            let seller1: any
            let seller1Headers: any
            let seller2: any
            let seller2Headers: any

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const result1 = await createSellerUser(appContainer, {
                    email: "seller1@test.com",
                    name: "Seller One",
                })
                seller1 = result1.seller
                seller1Headers = result1.headers

                const result2 = await createSellerUser(appContainer, {
                    email: "seller2@test.com",
                    name: "Seller Two",
                })
                seller2 = result2.seller
                seller2Headers = result2.headers
            })

            describe("POST /vendor/stock-locations", () => {
                it("should create a stock location", async () => {
                    const response = await api.post(
                        `/vendor/stock-locations`,
                        {
                            name: "Main Warehouse",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.stock_location).toBeDefined()
                    expect(response.data.stock_location.name).toEqual("Main Warehouse")
                })

                it("should create a stock location with address", async () => {
                    const response = await api.post(
                        `/vendor/stock-locations`,
                        {
                            name: "Warehouse with Address",
                            address: {
                                address_1: "123 Main Street",
                                address_2: "Suite 100",
                                city: "New York",
                                country_code: "us",
                                postal_code: "10001",
                                province: "NY",
                                phone: "+1234567890",
                                company: "Acme Inc",
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.stock_location.name).toEqual("Warehouse with Address")
                    expect(response.data.stock_location.address).toBeDefined()
                    expect(response.data.stock_location.address.address_1).toEqual("123 Main Street")
                    expect(response.data.stock_location.address.city).toEqual("New York")
                    expect(response.data.stock_location.address.country_code).toEqual("us")
                })

                it("should create a stock location with metadata", async () => {
                    const response = await api.post(
                        `/vendor/stock-locations`,
                        {
                            name: "Warehouse with Metadata",
                            metadata: {
                                capacity: 10000,
                                type: "distribution",
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.stock_location.metadata).toBeDefined()
                    expect(response.data.stock_location.metadata.capacity).toEqual(10000)
                    expect(response.data.stock_location.metadata.type).toEqual("distribution")
                })

                it("should fail to create stock location without name", async () => {
                    const response = await api
                        .post(
                            `/vendor/stock-locations`,
                            {},
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("should trim whitespace from name", async () => {
                    const response = await api.post(
                        `/vendor/stock-locations`,
                        {
                            name: "  Trimmed Name  ",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.stock_location.name).toEqual("Trimmed Name")
                })
            })

            describe("GET /vendor/stock-locations", () => {
                it("should list stock locations", async () => {
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: "Location A" },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/stock-locations`,
                        { name: "Location B" },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/stock-locations`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.stock_locations).toBeDefined()
                    expect(response.data.stock_locations.length).toBeGreaterThanOrEqual(2)
                })

                it("should filter stock locations by name", async () => {
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: "Unique Location Name" },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/stock-locations?name=Unique Location Name`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.stock_locations.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.stock_locations.some((l: any) => l.name === "Unique Location Name")
                    ).toBe(true)
                })

                it("should search stock locations with q parameter", async () => {
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: "Searchable Warehouse" },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/stock-locations?q=searchable`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.stock_locations.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.stock_locations.some((l: any) =>
                            l.name.toLowerCase().includes("searchable")
                        )
                    ).toBe(true)
                })

                it("should support pagination", async () => {
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: "Page Location A" },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/stock-locations`,
                        { name: "Page Location B" },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/stock-locations`,
                        { name: "Page Location C" },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/stock-locations?limit=2&offset=0`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.stock_locations.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })

                it("should not list another seller's stock locations", async () => {
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: "Seller 1 Only Location" },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/stock-locations`,
                        seller2Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(
                        response.data.stock_locations.every((l: any) => l.name !== "Seller 1 Only Location")
                    ).toBe(true)
                })
            })

            describe("GET /vendor/stock-locations/:id", () => {
                it("should get seller's own stock location", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "Get By Id Location" },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api.get(
                        `/vendor/stock-locations/${locationId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.stock_location).toBeDefined()
                    expect(response.data.stock_location.id).toEqual(locationId)
                    expect(response.data.stock_location.name).toEqual("Get By Id Location")
                })

                it("should not allow seller to get another seller's stock location", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "Seller 1 Location" },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api
                        .get(`/vendor/stock-locations/${locationId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for non-existent stock location", async () => {
                    const response = await api
                        .get(`/vendor/stock-locations/non-existent-id`, seller1Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return stock location with all expected fields", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        {
                            name: "Full Fields Location",
                            address: {
                                address_1: "456 Oak Avenue",
                                city: "Los Angeles",
                                country_code: "us",
                                postal_code: "90001",
                            },
                            metadata: { zone: "west" },
                        },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api.get(
                        `/vendor/stock-locations/${locationId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.stock_location.id).toBeDefined()
                    expect(response.data.stock_location.name).toEqual("Full Fields Location")
                    expect(response.data.stock_location.address).toBeDefined()
                    expect(response.data.stock_location.address.address_1).toEqual("456 Oak Avenue")
                    expect(response.data.stock_location.metadata).toBeDefined()
                    expect(response.data.stock_location.created_at).toBeDefined()
                    expect(response.data.stock_location.updated_at).toBeDefined()
                })
            })

            describe("POST /vendor/stock-locations/:id", () => {
                it("should update stock location name", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "Original Location Name" },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api.post(
                        `/vendor/stock-locations/${locationId}`,
                        { name: "Updated Location Name" },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.stock_location.name).toEqual("Updated Location Name")
                })

                it("should update stock location address", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        {
                            name: "Address Update Location",
                            address: {
                                address_1: "Old Address",
                                country_code: "us",
                            },
                        },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api.post(
                        `/vendor/stock-locations/${locationId}`,
                        {
                            address: {
                                address_1: "New Address",
                                city: "Chicago",
                                country_code: "us",
                                postal_code: "60601",
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.stock_location.address.address_1).toEqual("New Address")
                    expect(response.data.stock_location.address.city).toEqual("Chicago")
                })

                it("should update stock location metadata", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        {
                            name: "Metadata Update Location",
                            metadata: { key1: "value1" },
                        },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api.post(
                        `/vendor/stock-locations/${locationId}`,
                        {
                            metadata: { key2: "value2" },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.stock_location.metadata.key2).toEqual("value2")
                })

                it("should not allow seller to update another seller's stock location", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "Seller 1 Update Location" },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api
                        .post(
                            `/vendor/stock-locations/${locationId}`,
                            { name: "Hacked Name" },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("DELETE /vendor/stock-locations/:id", () => {
                it("should delete seller's own stock location", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "Delete Location" },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api.delete(
                        `/vendor/stock-locations/${locationId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data).toEqual({
                        id: locationId,
                        object: "stock_location",
                        deleted: true,
                    })

                    const getResponse = await api
                        .get(`/vendor/stock-locations/${locationId}`, seller1Headers)
                        .catch((e) => e.response)

                    expect(getResponse.status).toEqual(404)
                })

                it("should not allow seller to delete another seller's stock location", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "Seller 1 Delete Location" },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api
                        .delete(`/vendor/stock-locations/${locationId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)

                    const getResponse = await api.get(
                        `/vendor/stock-locations/${locationId}`,
                        seller1Headers
                    )

                    expect(getResponse.status).toEqual(200)
                })
            })

            describe("POST /vendor/stock-locations/:id/fulfillment-sets", () => {
                it("should create a fulfillment set for stock location", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "Fulfillment Set Location" },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api.post(
                        `/vendor/stock-locations/${locationId}/fulfillment-sets`,
                        {
                            name: "Default Fulfillment Set",
                            type: "pickup",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.stock_location).toBeDefined()
                })

                it("should create shipping fulfillment set", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "Shipping Fulfillment Location" },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api.post(
                        `/vendor/stock-locations/${locationId}/fulfillment-sets`,
                        {
                            name: "Shipping Set",
                            type: "shipping",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.stock_location).toBeDefined()
                })

                it("should not allow seller to create fulfillment set on another seller's location", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "Seller 1 Fulfillment Location" },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api
                        .post(
                            `/vendor/stock-locations/${locationId}/fulfillment-sets`,
                            {
                                name: "Unauthorized Set",
                                type: "pickup",
                            },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should fail to create fulfillment set without name", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "No Name Set Location" },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api
                        .post(
                            `/vendor/stock-locations/${locationId}/fulfillment-sets`,
                            {
                                type: "pickup",
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("should fail to create fulfillment set without type", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "No Type Set Location" },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api
                        .post(
                            `/vendor/stock-locations/${locationId}/fulfillment-sets`,
                            {
                                name: "Missing Type Set",
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })
            })

            describe("POST /vendor/stock-locations/:id/sales-channels", () => {
                it("should not allow seller to link sales channels to another seller's location", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "Seller 1 Sales Channel Location" },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api
                        .post(
                            `/vendor/stock-locations/${locationId}/sales-channels`,
                            {
                                add: ["sc_test"],
                            },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/stock-locations/:id/fulfillment-providers", () => {
                it("should not allow seller to link fulfillment providers to another seller's location", async () => {
                    const createResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "Seller 1 Provider Location" },
                        seller1Headers
                    )

                    const locationId = createResponse.data.stock_location.id

                    const response = await api
                        .post(
                            `/vendor/stock-locations/${locationId}/fulfillment-providers`,
                            {
                                add: ["fp_test"],
                            },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
