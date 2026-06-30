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

            const LIST_FIELDS = [
                "id",
                "product_id",
                "seller_id",
                "variant_id",
                "product.id",
                "product.title",
                "seller.id",
                "seller.name",
            ].join(",")

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
                    `/admin/offers?group_by_seller=true&fields=${LIST_FIELDS}`,
                    adminHeaders
                )

                expect(res.status).toEqual(200)

                const rows = (res.data.offers as any[]).filter(
                    (row) => row.product_id === product.id
                )
                // store 1's two offers collapse into a single row; store 2 keeps one
                expect(rows).toHaveLength(2)
                expect(res.data.count).toBeGreaterThanOrEqual(2)

                const bySeller = new Map(rows.map((r) => [r.seller_id, r]))
                expect(bySeller.has(seller1.id)).toBe(true)
                expect(bySeller.has(seller2.id)).toBe(true)

                for (const row of rows) {
                    // rows are plain OfferDTO: id is an offer id, with product/seller hydrated
                    expect(typeof row.id).toEqual("string")
                    expect(row.variant_id).toEqual(variantId)
                    expect(row.product?.id).toEqual(product.id)
                    expect(row.product?.title).toBeTruthy()
                    expect(row.seller?.id).toEqual(row.seller_id)
                }
            })

            it("returns flat per-offer rows without the group_by_seller flag", async () => {
                const product = await createVendorProduct(api, seller1Headers, {
                    title: `Flat Product ${Date.now()}`,
                    variants: [{ title: "Default" }],
                })
                const variantId = product.variants[0].id

                const sp1 = await createShippingProfile(seller1Headers, "f1")
                const sp2 = await createShippingProfile(seller2Headers, "f2")

                await api.post(
                    `/vendor/offers`,
                    {
                        sku: "FLAT-S1-A",
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
                        sku: "FLAT-S1-B",
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
                        sku: "FLAT-S2",
                        variant_id: variantId,
                        shipping_profile_id: sp2,
                        inventory_items: [{}],
                        prices: [{ amount: 1500, currency_code: "usd" }],
                    },
                    seller2Headers
                )

                const res = await api.get(`/admin/offers`, adminHeaders)

                expect(res.status).toEqual(200)
                const rows = (res.data.offers as any[]).filter(
                    (row) => row.product_id === product.id
                )
                // no grouping: every offer is its own row
                expect(rows).toHaveLength(3)
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
                    `/admin/offers?group_by_seller=true&seller_id=${seller1.id}`,
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

            it("scopes the product detail offers to a single store via seller_id", async () => {
                const product = await createVendorProduct(api, seller1Headers, {
                    title: `Detail Product ${Date.now()}`,
                    variants: [{ title: "Default" }],
                })
                const variantId = product.variants[0].id

                const sp1 = await createShippingProfile(seller1Headers, "d1")
                const sp2 = await createShippingProfile(seller2Headers, "d2")

                await api.post(
                    `/vendor/offers`,
                    {
                        sku: "DETAIL-S1",
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
                        sku: "DETAIL-S2",
                        variant_id: variantId,
                        shipping_profile_id: sp2,
                        inventory_items: [{}],
                        prices: [{ amount: 1500, currency_code: "usd" }],
                    },
                    seller2Headers
                )

                const fields =
                    "id,variants.id,variants.offers.id,variants.offers.seller_id"

                const scoped = await api.get(
                    `/admin/products/${product.id}?seller_id=${seller1.id}&fields=${fields}`,
                    adminHeaders
                )
                expect(scoped.status).toEqual(200)
                const scopedOffers = scoped.data.product.variants[0].offers
                expect(scopedOffers).toHaveLength(1)
                expect(scopedOffers[0].seller_id).toEqual(seller1.id)

                // without seller_id the wrap returns every store's offers
                const all = await api.get(
                    `/admin/products/${product.id}?fields=${fields}`,
                    adminHeaders
                )
                expect(all.data.product.variants[0].offers).toHaveLength(2)
            })
        })
    },
})
