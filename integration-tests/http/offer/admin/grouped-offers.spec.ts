import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"
import {
    adminHeaders,
    createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Admin - Grouped Offers", () => {
            let appContainer: MedusaContainer
            let seller1: any
            let seller1Headers: any
            let seller2: any
            let seller2Headers: any

            const createShippingProfile = async (headers: any, tag: string) => {
                const res = await api.post(
                    `/vendor/shipping-profiles`,
                    { name: `Standard ${tag}`, type: "default" },
                    headers
                )
                return res.data.shipping_profile.id as string
            }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)

                const r1 = await createSellerUser(appContainer, {
                    email: "grouped-seller1@test.com",
                    name: "Grouped Seller One",
                })
                seller1 = r1.seller
                seller1Headers = r1.headers

                const r2 = await createSellerUser(appContainer, {
                    email: "grouped-seller2@test.com",
                    name: "Grouped Seller Two",
                })
                seller2 = r2.seller
                seller2Headers = r2.headers
            })

            it("returns one row per (product, seller) for a product offered by two stores", async () => {
                const product = await createVendorProduct(
                    api,
                    seller1Headers,
                    {
                        title: `Shared Product ${Date.now()}`,
                        variants: [{ title: "Default" }],
                    }
                )
                const variantId = product.variants[0].id

                const sp1 = await createShippingProfile(seller1Headers, "s1")
                const sp2 = await createShippingProfile(seller2Headers, "s2")

                await api.post(
                    `/vendor/offers`,
                    {
                        sku: "GROUPED-S1-A",
                        variant_id: variantId,
                        shipping_profile_id: sp1,
                        inventory_items: [{}],
                        prices: [{ amount: 1000, currency_code: "usd" }],
                    },
                    seller1Headers
                )
                await api.post(
                    `/vendor/offers`,
                    {
                        sku: "GROUPED-S1-B",
                        variant_id: variantId,
                        shipping_profile_id: sp1,
                        inventory_items: [{}],
                        prices: [{ amount: 1100, currency_code: "usd" }],
                    },
                    seller1Headers
                )
                await api.post(
                    `/vendor/offers`,
                    {
                        sku: "GROUPED-S2",
                        variant_id: variantId,
                        shipping_profile_id: sp2,
                        inventory_items: [{}],
                        prices: [{ amount: 1500, currency_code: "usd" }],
                    },
                    seller2Headers
                )

                const res = await api.get(
                    `/admin/offers?grouped=true`,
                    adminHeaders
                )

                expect(res.status).toEqual(200)

                const rows = (res.data.offers as any[]).filter(
                    (row) => row.product_id === product.id
                )
                expect(rows).toHaveLength(2)
                expect(res.data.count).toBeGreaterThanOrEqual(2)

                const bySeller = new Map(rows.map((r) => [r.seller_id, r]))
                expect(bySeller.has(seller1.id)).toBe(true)
                expect(bySeller.has(seller2.id)).toBe(true)

                for (const row of rows) {
                    expect(row.id).toEqual(product.id)
                    expect(row.row_id).toEqual(
                        `${product.id}:${row.seller_id}`
                    )
                    expect(row.variant_count).toEqual(1)
                    expect(row.product?.id).toEqual(product.id)
                    expect(row.seller?.id).toEqual(row.seller_id)
                }

                expect(bySeller.get(seller1.id).offer_ids).toHaveLength(2)
                expect(bySeller.get(seller2.id).offer_ids).toHaveLength(1)
            })

            it("scopes the grouped list to a single store via seller_id", async () => {
                const product = await createVendorProduct(
                    api,
                    seller1Headers,
                    {
                        title: `Scoped Product ${Date.now()}`,
                        variants: [{ title: "Default" }],
                    }
                )
                const variantId = product.variants[0].id

                const sp1 = await createShippingProfile(seller1Headers, "sc1")
                const sp2 = await createShippingProfile(seller2Headers, "sc2")

                await api.post(
                    `/vendor/offers`,
                    {
                        sku: "SCOPED-S1",
                        variant_id: variantId,
                        shipping_profile_id: sp1,
                        inventory_items: [{}],
                        prices: [{ amount: 1000, currency_code: "usd" }],
                    },
                    seller1Headers
                )
                await api.post(
                    `/vendor/offers`,
                    {
                        sku: "SCOPED-S2",
                        variant_id: variantId,
                        shipping_profile_id: sp2,
                        inventory_items: [{}],
                        prices: [{ amount: 1500, currency_code: "usd" }],
                    },
                    seller2Headers
                )

                const res = await api.get(
                    `/admin/offers?grouped=true&seller_id=${seller1.id}`,
                    adminHeaders
                )

                expect(res.status).toEqual(200)
                const rows = res.data.offers as any[]
                expect(rows.length).toBeGreaterThanOrEqual(1)
                expect(
                    rows.every((row) => row.seller_id === seller1.id)
                ).toBe(true)
                const productRows = rows.filter(
                    (row) => row.product_id === product.id
                )
                expect(productRows).toHaveLength(1)
            })
        })
    },
})
