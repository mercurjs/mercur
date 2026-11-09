import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { createVendorProduct } from "../../../helpers/create-product"
import {
    adminHeaders,
    createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Admin - Offer batch stock locations", () => {
            let appContainer: MedusaContainer
            let seller1: any
            let seller1Headers: any
            let seller2Headers: any
            let seller1Location: any
            let seller2Location: any
            let variantId: string
            let shippingProfileId: string

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)

                const r1 = await createSellerUser(appContainer, {
                    email: "batch-loc-seller1@test.com",
                    name: "Batch Location Seller One",
                })
                seller1 = r1.seller
                seller1Headers = r1.headers

                const r2 = await createSellerUser(appContainer, {
                    email: "batch-loc-seller2@test.com",
                    name: "Batch Location Seller Two",
                })
                seller2Headers = r2.headers

                seller1Location = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: "Seller One Warehouse" },
                        seller1Headers
                    )
                ).data.stock_location
                seller2Location = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: "Seller Two Warehouse" },
                        seller2Headers
                    )
                ).data.stock_location

                const product = await createVendorProduct(api, seller1Headers, {
                    title: `Batch Location Product ${Date.now()}`,
                    variants: [{ title: "Default" }],
                })
                variantId = product.variants[0].id

                const profile = await createShippingProfile(appContainer, {
                    name: `Batch Location Profile ${Date.now()}`,
                })
                shippingProfileId = profile.id as string
            })

            const batchBody = (sku: string, locationId: string) => ({
                seller_id: seller1.id,
                offers: [
                    {
                        sku,
                        variant_id: variantId,
                        shipping_profile_id: shippingProfileId,
                        inventory_items: [
                            {
                                stock_levels: [
                                    { location_id: locationId, stocked_quantity: 5 },
                                ],
                            },
                        ],
                        prices: [{ amount: 1000, currency_code: "usd" }],
                    },
                ],
            })

            it("rejects stock levels at a location owned by another store", async () => {
                const response = await api
                    .post(
                        `/admin/offers/batch`,
                        batchBody("BATCH-LOC-FOREIGN", seller2Location.id),
                        adminHeaders
                    )
                    .catch((e) => e.response)

                expect(response.status).toEqual(404)
                expect(response.data.message).toContain(seller2Location.id)

                const items = await api.get(
                    `/admin/inventory-items?sku=BATCH-LOC-FOREIGN`,
                    adminHeaders
                )
                expect(items.data.inventory_items).toHaveLength(0)
            })

            it("stocks the item at the store's own location and links it to that store", async () => {
                const response = await api.post(
                    `/admin/offers/batch`,
                    batchBody("BATCH-LOC-OWN", seller1Location.id),
                    adminHeaders
                )

                expect(response.status).toEqual(201)

                const items = await api.get(
                    `/admin/inventory-items?sku=BATCH-LOC-OWN&fields=id,sku,*location_levels,+seller.id`,
                    adminHeaders
                )
                expect(items.data.inventory_items).toHaveLength(1)

                const [item] = items.data.inventory_items
                expect(item.seller.id).toEqual(seller1.id)
                expect(item.location_levels).toEqual([
                    expect.objectContaining({
                        location_id: seller1Location.id,
                        stocked_quantity: 5,
                    }),
                ])
            })
        })
    },
})
