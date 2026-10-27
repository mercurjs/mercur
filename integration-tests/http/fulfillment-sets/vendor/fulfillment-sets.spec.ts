import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import {
    createScopedAdminHeaders,
    createShippingRuleAndEnable,
} from "../../../helpers/shipping-rules"

jest.setTimeout(120000)

type Headers = { headers: Record<string, string> }

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Fulfillment Sets", () => {
            let appContainer: MedusaContainer
            let seller1Headers: Headers
            let seller2Headers: Headers

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                seller1Headers = (
                    await createSellerUser(appContainer, {
                        email: "seller1@test.com",
                        name: "Seller One",
                    })
                ).headers

                seller2Headers = (
                    await createSellerUser(appContainer, {
                        email: "seller2@test.com",
                        name: "Seller Two",
                    })
                ).headers
            })

            const enableShippingAtNewLocation = async (
                headers: Headers,
                locationName: string
            ) => {
                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: locationName },
                        headers
                    )
                ).data.stock_location

                const shippingProfile = await createShippingProfile(appContainer, {
                    name: `SP ${locationName}`,
                })

                const { shippingOption } = await createShippingRuleAndEnable(api, {
                    adminHeaders: await createScopedAdminHeaders(appContainer),
                    sellerHeaders: headers,
                    stockLocationId: stockLocation.id,
                    shippingProfileId: shippingProfile.id,
                    countryCodes: ["us", "ca"],
                })

                const serviceZone = (
                    await api.get(
                        `/vendor/shipping-options/${shippingOption.id}`,
                        headers
                    )
                ).data.shipping_option.service_zone

                return {
                    stockLocationId: stockLocation.id as string,
                    fulfillmentSetId: serviceZone.fulfillment_set_id as string,
                    serviceZoneId: serviceZone.id as string,
                }
            }

            describe("removed seller shipping setup endpoints", () => {
                it("does not expose DELETE /vendor/fulfillment-sets/:id", async () => {
                    const { fulfillmentSetId } = await enableShippingAtNewLocation(
                        seller1Headers,
                        "Delete FS Location"
                    )

                    const response = await api
                        .delete(`/vendor/fulfillment-sets/${fulfillmentSetId}`, seller1Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("does not expose POST /vendor/fulfillment-sets/:id/service-zones", async () => {
                    const { fulfillmentSetId } = await enableShippingAtNewLocation(
                        seller1Headers,
                        "Create SZ Location"
                    )

                    const response = await api
                        .post(
                            `/vendor/fulfillment-sets/${fulfillmentSetId}/service-zones`,
                            {
                                name: "Seller Zone",
                                geo_zones: [{ type: "country", country_code: "us" }],
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("does not expose POST /vendor/fulfillment-sets/:id/service-zones/:zone_id", async () => {
                    const { fulfillmentSetId, serviceZoneId } =
                        await enableShippingAtNewLocation(seller1Headers, "Update SZ Location")

                    const response = await api
                        .post(
                            `/vendor/fulfillment-sets/${fulfillmentSetId}/service-zones/${serviceZoneId}`,
                            { name: "Renamed Zone" },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("does not expose DELETE /vendor/fulfillment-sets/:id/service-zones/:zone_id", async () => {
                    const { fulfillmentSetId, serviceZoneId } =
                        await enableShippingAtNewLocation(seller1Headers, "Delete SZ Location")

                    const response = await api
                        .delete(
                            `/vendor/fulfillment-sets/${fulfillmentSetId}/service-zones/${serviceZoneId}`,
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)

                    const stillThere = await api.get(
                        `/vendor/fulfillment-sets/${fulfillmentSetId}/service-zones/${serviceZoneId}`,
                        seller1Headers
                    )
                    expect(stillThere.status).toEqual(200)
                })
            })

            describe("GET /vendor/fulfillment-sets/:id/service-zones/:zone_id", () => {
                it("should get a service zone by id", async () => {
                    const { fulfillmentSetId, serviceZoneId } =
                        await enableShippingAtNewLocation(seller1Headers, "Get SZ Location")

                    const response = await api.get(
                        `/vendor/fulfillment-sets/${fulfillmentSetId}/service-zones/${serviceZoneId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.service_zone.id).toEqual(serviceZoneId)
                    expect(response.data.service_zone.geo_zones).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({ type: "country", country_code: "us" }),
                            expect.objectContaining({ type: "country", country_code: "ca" }),
                        ])
                    )
                })

                it("should not allow seller to get another seller's service zone", async () => {
                    const { fulfillmentSetId, serviceZoneId } =
                        await enableShippingAtNewLocation(
                            seller1Headers,
                            "Seller 1 Get SZ Location"
                        )

                    const response = await api
                        .get(
                            `/vendor/fulfillment-sets/${fulfillmentSetId}/service-zones/${serviceZoneId}`,
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for non-existent service zone", async () => {
                    const { fulfillmentSetId } = await enableShippingAtNewLocation(
                        seller1Headers,
                        "Non Existent SZ Location"
                    )

                    const response = await api
                        .get(
                            `/vendor/fulfillment-sets/${fulfillmentSetId}/service-zones/non-existent-id`,
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
