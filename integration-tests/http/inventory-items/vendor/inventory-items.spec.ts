import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Inventory Items", () => {
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

            describe("POST /vendor/inventory-items", () => {
                it("should create an inventory item", async () => {
                    const response = await api.post(
                        `/vendor/inventory-items`,
                        {
                            title: "Test Inventory Item",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.inventory_item).toBeDefined()
                    expect(response.data.inventory_item.title).toEqual("Test Inventory Item")
                })

                it("should create an inventory item with all fields", async () => {
                    const response = await api.post(
                        `/vendor/inventory-items`,
                        {
                            title: "Full Inventory Item",
                            description: "A complete inventory item",
                            hs_code: "1234567890",
                            weight: 500,
                            length: 10,
                            height: 5,
                            width: 8,
                            origin_country: "US",
                            mid_code: "MID-001",
                            material: "Cotton",
                            requires_shipping: true,
                            thumbnail: "https://example.com/thumbnail.jpg",
                            metadata: { custom: "data" },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.inventory_item.title).toEqual("Full Inventory Item")
                    expect(response.data.inventory_item.description).toEqual("A complete inventory item")
                    expect(response.data.inventory_item.hs_code).toEqual("1234567890")
                    expect(response.data.inventory_item.weight).toEqual(500)
                    expect(response.data.inventory_item.length).toEqual(10)
                    expect(response.data.inventory_item.height).toEqual(5)
                    expect(response.data.inventory_item.width).toEqual(8)
                    expect(response.data.inventory_item.origin_country).toEqual("US")
                    expect(response.data.inventory_item.mid_code).toEqual("MID-001")
                    expect(response.data.inventory_item.material).toEqual("Cotton")
                    expect(response.data.inventory_item.requires_shipping).toEqual(true)
                    expect(response.data.inventory_item.thumbnail).toEqual("https://example.com/thumbnail.jpg")
                    expect(response.data.inventory_item.metadata).toEqual({ custom: "data" })
                })

                it("should create an inventory item without sku", async () => {
                    const response = await api.post(
                        `/vendor/inventory-items`,
                        {
                            title: "No SKU Item",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.inventory_item).toBeDefined()
                    expect(response.data.inventory_item.title).toEqual("No SKU Item")
                })

                it("should fail to create inventory item with SKU that has no matching variant", async () => {
                    const response = await api.post(
                        `/vendor/inventory-items`,
                        {
                            sku: "NON-EXISTENT-SKU",
                            title: "Item with Invalid SKU",
                        },
                        seller1Headers
                    ).catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("GET /vendor/inventory-items", () => {
                it("should list inventory items", async () => {
                    await api.post(
                        `/vendor/inventory-items`,
                        { title: "Item A" },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/inventory-items`,
                        { title: "Item B" },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/inventory-items`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.inventory_items).toBeDefined()
                    expect(response.data.inventory_items.length).toBeGreaterThanOrEqual(2)
                })

                it("should filter inventory items by title using q parameter", async () => {
                    await api.post(
                        `/vendor/inventory-items`,
                        { title: "UniqueFilterItem" },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/inventory-items?q=UniqueFilterItem`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.inventory_items.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.inventory_items.some((i: any) => i.title === "UniqueFilterItem")
                    ).toBe(true)
                })

                it("should search inventory items with q parameter", async () => {
                    await api.post(
                        `/vendor/inventory-items`,
                        { title: "Searchable Widget" },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/inventory-items?q=searchable`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.inventory_items.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.inventory_items.some((i: any) =>
                            i.title.toLowerCase().includes("searchable")
                        )
                    ).toBe(true)
                })

                it("should support pagination", async () => {
                    await api.post(
                        `/vendor/inventory-items`,
                        { title: "Page Item A" },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/inventory-items`,
                        { title: "Page Item B" },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/inventory-items`,
                        { title: "Page Item C" },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/inventory-items?limit=2&offset=0`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.inventory_items.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })

                it("should not list another seller's inventory items", async () => {
                    const createResponse = await api.post(
                        `/vendor/inventory-items`,
                        { title: "Seller 1 Only Item" },
                        seller1Headers
                    )

                    const itemId = createResponse.data.inventory_item.id

                    const response = await api.get(
                        `/vendor/inventory-items`,
                        seller2Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(
                        response.data.inventory_items.every((i: any) => i.id !== itemId)
                    ).toBe(true)
                })
            })

            describe("GET /vendor/inventory-items/:id", () => {
                it("should get seller's own inventory item", async () => {
                    const createResponse = await api.post(
                        `/vendor/inventory-items`,
                        { title: "Get By Id Item" },
                        seller1Headers
                    )

                    const itemId = createResponse.data.inventory_item.id

                    const response = await api.get(
                        `/vendor/inventory-items/${itemId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.inventory_item).toBeDefined()
                    expect(response.data.inventory_item.id).toEqual(itemId)
                    expect(response.data.inventory_item.title).toEqual("Get By Id Item")
                })

                it("should not allow seller to get another seller's inventory item", async () => {
                    const createResponse = await api.post(
                        `/vendor/inventory-items`,
                        { title: "Seller 1 Item" },
                        seller1Headers
                    )

                    const itemId = createResponse.data.inventory_item.id

                    const response = await api
                        .get(`/vendor/inventory-items/${itemId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for non-existent inventory item", async () => {
                    const response = await api
                        .get(`/vendor/inventory-items/non-existent-id`, seller1Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return inventory item with all expected fields", async () => {
                    const createResponse = await api.post(
                        `/vendor/inventory-items`,
                        {
                            title: "Full Fields Item",
                            description: "Description",
                            weight: 100,
                            metadata: { key: "value" },
                        },
                        seller1Headers
                    )

                    const itemId = createResponse.data.inventory_item.id

                    const response = await api.get(
                        `/vendor/inventory-items/${itemId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.inventory_item.id).toBeDefined()
                    expect(response.data.inventory_item.title).toEqual("Full Fields Item")
                    expect(response.data.inventory_item.description).toEqual("Description")
                    expect(response.data.inventory_item.weight).toEqual(100)
                    expect(response.data.inventory_item.metadata).toEqual({ key: "value" })
                    expect(response.data.inventory_item.created_at).toBeDefined()
                    expect(response.data.inventory_item.updated_at).toBeDefined()
                })
            })

            describe("POST /vendor/inventory-items/:id", () => {
                it("should update inventory item title", async () => {
                    const createResponse = await api.post(
                        `/vendor/inventory-items`,
                        { title: "Original Title" },
                        seller1Headers
                    )

                    const itemId = createResponse.data.inventory_item.id

                    const response = await api.post(
                        `/vendor/inventory-items/${itemId}`,
                        { title: "Updated Title" },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.inventory_item.title).toEqual("Updated Title")
                })

                it("should update inventory item description", async () => {
                    const createResponse = await api.post(
                        `/vendor/inventory-items`,
                        { title: "Description Update Item", description: "Original Description" },
                        seller1Headers
                    )

                    const itemId = createResponse.data.inventory_item.id

                    const response = await api.post(
                        `/vendor/inventory-items/${itemId}`,
                        { description: "Updated Description" },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.inventory_item.description).toEqual("Updated Description")
                })

                it("should update inventory item dimensions", async () => {
                    const createResponse = await api.post(
                        `/vendor/inventory-items`,
                        {
                            title: "Dimension Update Item",
                            weight: 100,
                            length: 10,
                            height: 5,
                            width: 8,
                        },
                        seller1Headers
                    )

                    const itemId = createResponse.data.inventory_item.id

                    const response = await api.post(
                        `/vendor/inventory-items/${itemId}`,
                        {
                            weight: 200,
                            length: 20,
                            height: 10,
                            width: 16,
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.inventory_item.weight).toEqual(200)
                    expect(response.data.inventory_item.length).toEqual(20)
                    expect(response.data.inventory_item.height).toEqual(10)
                    expect(response.data.inventory_item.width).toEqual(16)
                })

                it("should update inventory item metadata", async () => {
                    const createResponse = await api.post(
                        `/vendor/inventory-items`,
                        {
                            title: "Metadata Update Item",
                            metadata: { key1: "value1" },
                        },
                        seller1Headers
                    )

                    const itemId = createResponse.data.inventory_item.id

                    const response = await api.post(
                        `/vendor/inventory-items/${itemId}`,
                        {
                            metadata: { key2: "value2" },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.inventory_item.metadata.key2).toEqual("value2")
                })

                it("should not allow seller to update another seller's inventory item", async () => {
                    const createResponse = await api.post(
                        `/vendor/inventory-items`,
                        { title: "Seller 1 Update Item" },
                        seller1Headers
                    )

                    const itemId = createResponse.data.inventory_item.id

                    const response = await api
                        .post(
                            `/vendor/inventory-items/${itemId}`,
                            { title: "Hacked Title" },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("DELETE /vendor/inventory-items/:id", () => {
                it("should delete seller's own inventory item", async () => {
                    const createResponse = await api.post(
                        `/vendor/inventory-items`,
                        { title: "Delete Item" },
                        seller1Headers
                    )

                    const itemId = createResponse.data.inventory_item.id

                    const response = await api.delete(
                        `/vendor/inventory-items/${itemId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data).toEqual({
                        id: itemId,
                        object: "inventory_item",
                        deleted: true,
                    })

                    const getResponse = await api
                        .get(`/vendor/inventory-items/${itemId}`, seller1Headers)
                        .catch((e) => e.response)

                    expect(getResponse.status).toEqual(404)
                })

                it("should not allow seller to delete another seller's inventory item", async () => {
                    const createResponse = await api.post(
                        `/vendor/inventory-items`,
                        { title: "Seller 1 Delete Item" },
                        seller1Headers
                    )

                    const itemId = createResponse.data.inventory_item.id

                    const response = await api
                        .delete(`/vendor/inventory-items/${itemId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)

                    const getResponse = await api.get(
                        `/vendor/inventory-items/${itemId}`,
                        seller1Headers
                    )

                    expect(getResponse.status).toEqual(200)
                })
            })

            describe("Location Levels", () => {
                let stockLocationId: string

                beforeEach(async () => {
                    const locationResponse = await api.post(
                        `/vendor/stock-locations`,
                        { name: "Test Warehouse" },
                        seller1Headers
                    )

                    stockLocationId = locationResponse.data.stock_location.id
                })

                describe("GET /vendor/inventory-items/:id/location-levels", () => {
                    it("should list location levels for inventory item", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Item with Levels" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels`,
                            {
                                location_id: stockLocationId,
                                stocked_quantity: 100,
                            },
                            seller1Headers
                        )

                        const response = await api.get(
                            `/vendor/inventory-items/${itemId}/location-levels`,
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        expect(response.data.inventory_levels).toBeDefined()
                        expect(response.data.inventory_levels.length).toBeGreaterThanOrEqual(1)
                    })

                    it("should not allow seller to list another seller's inventory item location levels", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Seller 1 Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        const response = await api
                            .get(`/vendor/inventory-items/${itemId}/location-levels`, seller2Headers)
                            .catch((e) => e.response)

                        expect(response.status).toEqual(404)
                    })
                })

                describe("POST /vendor/inventory-items/:id/location-levels", () => {
                    it("should create location level for inventory item", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Item for Level" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        const response = await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels`,
                            {
                                location_id: stockLocationId,
                                stocked_quantity: 50,
                                incoming_quantity: 10,
                            },
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        expect(response.data.inventory_item).toBeDefined()
                    })

                    it("should create location level with zero quantities", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Zero Quantity Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        const response = await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels`,
                            {
                                location_id: stockLocationId,
                                stocked_quantity: 0,
                                incoming_quantity: 0,
                            },
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                    })

                    it("should not allow seller to create location level for another seller's inventory item", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Seller 1 Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        const response = await api
                            .post(
                                `/vendor/inventory-items/${itemId}/location-levels`,
                                {
                                    location_id: stockLocationId,
                                    stocked_quantity: 100,
                                },
                                seller2Headers
                            )
                            .catch((e) => e.response)

                        expect(response.status).toEqual(404)
                    })

                    it("should fail to create location level without location_id", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Missing Location Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        const response = await api
                            .post(
                                `/vendor/inventory-items/${itemId}/location-levels`,
                                {
                                    stocked_quantity: 100,
                                },
                                seller1Headers
                            )
                            .catch((e) => e.response)

                        expect(response.status).toEqual(400)
                    })
                })

                describe("POST /vendor/inventory-items/:id/location-levels/:location_id", () => {
                    it("should update location level", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Update Level Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels`,
                            {
                                location_id: stockLocationId,
                                stocked_quantity: 50,
                            },
                            seller1Headers
                        )

                        const response = await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels/${stockLocationId}`,
                            {
                                stocked_quantity: 100,
                                incoming_quantity: 25,
                            },
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        expect(response.data.inventory_item).toBeDefined()
                    })

                    it("should not allow seller to update another seller's inventory item location level", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Seller 1 Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels`,
                            {
                                location_id: stockLocationId,
                                stocked_quantity: 50,
                            },
                            seller1Headers
                        )

                        const response = await api
                            .post(
                                `/vendor/inventory-items/${itemId}/location-levels/${stockLocationId}`,
                                {
                                    stocked_quantity: 999,
                                },
                                seller2Headers
                            )
                            .catch((e) => e.response)

                        expect(response.status).toEqual(404)
                    })
                })

                describe("DELETE /vendor/inventory-items/:id/location-levels/:location_id", () => {
                    it("should delete location level with zero stock", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Delete Level Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels`,
                            {
                                location_id: stockLocationId,
                                stocked_quantity: 0,
                            },
                            seller1Headers
                        )

                        const response = await api.delete(
                            `/vendor/inventory-items/${itemId}/location-levels/${stockLocationId}`,
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        expect(response.data.deleted).toEqual(true)
                        expect(response.data.object).toEqual("inventory-level")
                    })

                    it("should not allow seller to delete another seller's inventory item location level", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Seller 1 Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels`,
                            {
                                location_id: stockLocationId,
                                stocked_quantity: 0,
                            },
                            seller1Headers
                        )

                        const response = await api
                            .delete(
                                `/vendor/inventory-items/${itemId}/location-levels/${stockLocationId}`,
                                seller2Headers
                            )
                            .catch((e) => e.response)

                        expect(response.status).toEqual(404)
                    })

                    it("should return 404 for non-existent location level", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "No Level Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        const response = await api
                            .delete(
                                `/vendor/inventory-items/${itemId}/location-levels/non-existent-location`,
                                seller1Headers
                            )
                            .catch((e) => e.response)

                        expect(response.status).toEqual(404)
                    })
                })

                describe("POST /vendor/inventory-items/:id/location-levels/batch", () => {
                    let stockLocation2Id: string

                    beforeEach(async () => {
                        const location2Response = await api.post(
                            `/vendor/stock-locations`,
                            { name: "Second Warehouse" },
                            seller1Headers
                        )

                        stockLocation2Id = location2Response.data.stock_location.id
                    })

                    it("should batch create location levels", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Batch Create Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        const response = await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels/batch`,
                            {
                                create: [
                                    {
                                        location_id: stockLocationId,
                                        stocked_quantity: 100,
                                    },
                                    {
                                        location_id: stockLocation2Id,
                                        stocked_quantity: 50,
                                    },
                                ],
                            },
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        expect(response.data.created).toBeDefined()
                        expect(response.data.created.length).toEqual(2)
                    })

                    it("should batch update location levels", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Batch Update Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels/batch`,
                            {
                                create: [
                                    {
                                        location_id: stockLocationId,
                                        stocked_quantity: 100,
                                    },
                                ],
                            },
                            seller1Headers
                        )

                        const response = await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels/batch`,
                            {
                                update: [
                                    {
                                        location_id: stockLocationId,
                                        stocked_quantity: 200,
                                    },
                                ],
                            },
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        expect(response.data.updated).toBeDefined()
                    })

                    it("should batch delete location levels", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Batch Delete Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        const createLevelResponse = await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels/batch`,
                            {
                                create: [
                                    {
                                        location_id: stockLocationId,
                                        stocked_quantity: 100,
                                    },
                                ],
                            },
                            seller1Headers
                        )

                        const levelId = createLevelResponse.data.created[0].id

                        const response = await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels/batch`,
                            {
                                delete: [levelId],
                                force: true,
                            },
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        expect(response.data.deleted).toBeDefined()
                    })

                    it("should perform mixed batch operations", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Mixed Batch Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        const createLevelResponse = await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels/batch`,
                            {
                                create: [
                                    {
                                        location_id: stockLocationId,
                                        stocked_quantity: 100,
                                    },
                                ],
                            },
                            seller1Headers
                        )

                        const levelId = createLevelResponse.data.created[0].id

                        const response = await api.post(
                            `/vendor/inventory-items/${itemId}/location-levels/batch`,
                            {
                                create: [
                                    {
                                        location_id: stockLocation2Id,
                                        stocked_quantity: 75,
                                    },
                                ],
                                update: [
                                    {
                                        location_id: stockLocationId,
                                        stocked_quantity: 150,
                                    },
                                ],
                            },
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        expect(response.data.created).toBeDefined()
                        expect(response.data.updated).toBeDefined()
                    })

                    it("should not allow seller to batch operations on another seller's inventory item", async () => {
                        const createItemResponse = await api.post(
                            `/vendor/inventory-items`,
                            { title: "Seller 1 Batch Item" },
                            seller1Headers
                        )

                        const itemId = createItemResponse.data.inventory_item.id

                        const response = await api
                            .post(
                                `/vendor/inventory-items/${itemId}/location-levels/batch`,
                                {
                                    create: [
                                        {
                                            location_id: stockLocationId,
                                            stocked_quantity: 100,
                                        },
                                    ],
                                },
                                seller2Headers
                            )
                            .catch((e) => e.response)

                        expect(response.status).toEqual(404)
                    })
                })
            })
        })
    },
})
