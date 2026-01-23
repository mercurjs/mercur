import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer, IFulfillmentModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Fulfillment Sets", () => {
            let appContainer: MedusaContainer
            let seller1: any
            let seller1Headers: any
            let seller2: any
            let seller2Headers: any
            let fulfillmentModuleService: IFulfillmentModuleService

            beforeAll(async () => {
                appContainer = getContainer()
                fulfillmentModuleService = appContainer.resolve(Modules.FULFILLMENT)
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

            const createStockLocationWithFulfillmentSet = async (
                headers: any,
                locationName: string,
                fulfillmentSetName: string,
                fulfillmentSetType: string = "shipping"
            ) => {
                const locationResponse = await api.post(
                    `/vendor/stock-locations`,
                    { name: locationName },
                    headers
                )

                const locationId = locationResponse.data.stock_location.id

                await api.post(
                    `/vendor/stock-locations/${locationId}/fulfillment-sets`,
                    {
                        name: fulfillmentSetName,
                        type: fulfillmentSetType,
                    },
                    headers
                )

                const fulfillmentSets = await fulfillmentModuleService.listFulfillmentSets({
                    name: fulfillmentSetName,
                })

                return {
                    stockLocation: locationResponse.data.stock_location,
                    fulfillmentSet: fulfillmentSets[0],
                    locationId,
                }
            }

            describe("DELETE /vendor/fulfillment-sets/:id", () => {
                it("should delete seller's own fulfillment set", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Delete FS Location",
                        "Delete Fulfillment Set"
                    )

                    const response = await api.delete(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data).toEqual({
                        id: fulfillmentSet.id,
                        object: "fulfillment_set",
                        deleted: true,
                    })
                })

                it("should not allow seller to delete another seller's fulfillment set", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Seller 1 FS Location",
                        "Seller 1 Fulfillment Set"
                    )

                    const response = await api
                        .delete(`/vendor/fulfillment-sets/${fulfillmentSet.id}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for non-existent fulfillment set", async () => {
                    const response = await api
                        .delete(`/vendor/fulfillment-sets/non-existent-id`, seller1Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/fulfillment-sets/:id/service-zones", () => {
                it("should create a service zone with country geo zone", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Service Zone Location",
                        "Service Zone FS"
                    )

                    const response = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: "US Zone",
                            geo_zones: [
                                {
                                    type: "country",
                                    country_code: "us",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.fulfillment_set).toBeDefined()
                    expect(response.data.fulfillment_set.service_zones).toBeDefined()
                    expect(response.data.fulfillment_set.service_zones.length).toBeGreaterThanOrEqual(1)

                    const createdZone = response.data.fulfillment_set.service_zones.find(
                        (z: any) => z.name === "US Zone"
                    )
                    expect(createdZone).toBeDefined()
                    expect(createdZone.geo_zones).toBeDefined()
                })

                it("should create a service zone with province geo zone", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Province Zone Location",
                        "Province Zone FS"
                    )

                    const response = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: "California Zone",
                            geo_zones: [
                                {
                                    type: "province",
                                    country_code: "us",
                                    province_code: "ca",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.fulfillment_set.service_zones).toBeDefined()

                    const createdZone = response.data.fulfillment_set.service_zones.find(
                        (z: any) => z.name === "California Zone"
                    )
                    expect(createdZone).toBeDefined()
                })

                it("should create a service zone with city geo zone", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "City Zone Location",
                        "City Zone FS"
                    )

                    const response = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: "Los Angeles Zone",
                            geo_zones: [
                                {
                                    type: "city",
                                    country_code: "us",
                                    province_code: "ca",
                                    city: "Los Angeles",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)

                    const createdZone = response.data.fulfillment_set.service_zones.find(
                        (z: any) => z.name === "Los Angeles Zone"
                    )
                    expect(createdZone).toBeDefined()
                })

                it("should create a service zone with multiple geo zones", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Multi Zone Location",
                        "Multi Zone FS"
                    )

                    const response = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: "Multi Country Zone",
                            geo_zones: [
                                {
                                    type: "country",
                                    country_code: "us",
                                },
                                {
                                    type: "country",
                                    country_code: "ca",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)

                    const createdZone = response.data.fulfillment_set.service_zones.find(
                        (z: any) => z.name === "Multi Country Zone"
                    )
                    expect(createdZone).toBeDefined()
                    expect(createdZone.geo_zones.length).toBeGreaterThanOrEqual(2)
                })

                it("should create a service zone without geo zones", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "No Geo Zone Location",
                        "No Geo Zone FS"
                    )

                    const response = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: "Empty Geo Zone",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)

                    const createdZone = response.data.fulfillment_set.service_zones.find(
                        (z: any) => z.name === "Empty Geo Zone"
                    )
                    expect(createdZone).toBeDefined()
                })

                it("should not allow seller to create service zone on another seller's fulfillment set", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Seller 1 SZ Location",
                        "Seller 1 SZ FS"
                    )

                    const response = await api
                        .post(
                            `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                            {
                                name: "Unauthorized Zone",
                                geo_zones: [
                                    {
                                        type: "country",
                                        country_code: "us",
                                    },
                                ],
                            },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should fail to create service zone without name", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "No Name SZ Location",
                        "No Name SZ FS"
                    )

                    const response = await api
                        .post(
                            `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                            {
                                geo_zones: [
                                    {
                                        type: "country",
                                        country_code: "us",
                                    },
                                ],
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })
            })

            describe("GET /vendor/fulfillment-sets/:id/service-zones/:zone_id", () => {
                it("should get a service zone by id", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Get SZ Location",
                        "Get SZ FS"
                    )

                    const createZoneResponse = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: "Get Zone Test",
                            geo_zones: [
                                {
                                    type: "country",
                                    country_code: "us",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const serviceZone = createZoneResponse.data.fulfillment_set.service_zones.find(
                        (z: any) => z.name === "Get Zone Test"
                    )

                    const response = await api.get(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones/${serviceZone.id}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.service_zone).toBeDefined()
                    expect(response.data.service_zone.id).toEqual(serviceZone.id)
                    expect(response.data.service_zone.name).toEqual("Get Zone Test")
                })

                it("should not allow seller to get another seller's service zone", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Seller 1 Get SZ Location",
                        "Seller 1 Get SZ FS"
                    )

                    const createZoneResponse = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: "Seller 1 Zone",
                        },
                        seller1Headers
                    )

                    const serviceZone = createZoneResponse.data.fulfillment_set.service_zones.find(
                        (z: any) => z.name === "Seller 1 Zone"
                    )

                    const response = await api
                        .get(
                            `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones/${serviceZone.id}`,
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for non-existent service zone", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Non Existent SZ Location",
                        "Non Existent SZ FS"
                    )

                    const response = await api
                        .get(
                            `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones/non-existent-id`,
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/fulfillment-sets/:id/service-zones/:zone_id", () => {
                it("should update service zone name", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Update SZ Location",
                        "Update SZ FS"
                    )

                    const createZoneResponse = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: "Original Zone Name",
                        },
                        seller1Headers
                    )

                    const serviceZone = createZoneResponse.data.fulfillment_set.service_zones.find(
                        (z: any) => z.name === "Original Zone Name"
                    )

                    const response = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones/${serviceZone.id}`,
                        {
                            name: "Updated Zone Name",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.fulfillment_set).toBeDefined()

                    const updatedZone = response.data.fulfillment_set.service_zones.find(
                        (z: any) => z.id === serviceZone.id
                    )
                    expect(updatedZone.name).toEqual("Updated Zone Name")
                })

                it("should update service zone geo zones", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Update Geo Location",
                        "Update Geo FS"
                    )

                    const createZoneResponse = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: "Geo Update Zone",
                            geo_zones: [
                                {
                                    type: "country",
                                    country_code: "us",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const serviceZone = createZoneResponse.data.fulfillment_set.service_zones.find(
                        (z: any) => z.name === "Geo Update Zone"
                    )

                    const response = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones/${serviceZone.id}`,
                        {
                            geo_zones: [
                                {
                                    type: "country",
                                    country_code: "ca",
                                },
                                {
                                    type: "country",
                                    country_code: "mx",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                })

                it("should not allow seller to update another seller's service zone", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Seller 1 Update SZ Location",
                        "Seller 1 Update SZ FS"
                    )

                    const createZoneResponse = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: "Seller 1 Update Zone",
                        },
                        seller1Headers
                    )

                    const serviceZone = createZoneResponse.data.fulfillment_set.service_zones.find(
                        (z: any) => z.name === "Seller 1 Update Zone"
                    )

                    const response = await api
                        .post(
                            `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones/${serviceZone.id}`,
                            { name: "Hacked Zone Name" },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("DELETE /vendor/fulfillment-sets/:id/service-zones/:zone_id", () => {
                it("should delete seller's own service zone", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Delete SZ Location",
                        "Delete SZ FS"
                    )

                    const createZoneResponse = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: "Delete Zone",
                        },
                        seller1Headers
                    )

                    const serviceZone = createZoneResponse.data.fulfillment_set.service_zones.find(
                        (z: any) => z.name === "Delete Zone"
                    )

                    const response = await api.delete(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones/${serviceZone.id}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data).toEqual({
                        id: serviceZone.id,
                        object: "service_zone",
                        deleted: true,
                    })
                })

                it("should not allow seller to delete another seller's service zone", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Seller 1 Delete SZ Location",
                        "Seller 1 Delete SZ FS"
                    )

                    const createZoneResponse = await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: "Seller 1 Delete Zone",
                        },
                        seller1Headers
                    )

                    const serviceZone = createZoneResponse.data.fulfillment_set.service_zones.find(
                        (z: any) => z.name === "Seller 1 Delete Zone"
                    )

                    const response = await api
                        .delete(
                            `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones/${serviceZone.id}`,
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for non-existent service zone", async () => {
                    const { fulfillmentSet } = await createStockLocationWithFulfillmentSet(
                        seller1Headers,
                        "Non Existent Delete Location",
                        "Non Existent Delete FS"
                    )

                    const response = await api
                        .delete(
                            `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones/non-existent-id`,
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
