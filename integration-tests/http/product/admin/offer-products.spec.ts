import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

/**
 * Coverage for the **admin** product endpoint's offer overlay
 * (`wrapProductVariantsWithOffers` + the `?has_offer=true` offered-product
 * filter) — the backend slice of SPEC-010. The admin Offers surface reads
 * `/admin/products` with `variants.offers.*`. Unlike the seller-scoped
 * vendor wrap, the admin wrap is **platform-wide**: it attaches every
 * seller's offers (each carrying `seller`), so these assert the *inverse*
 * of the vendor isolation test — both sellers' offers on a shared variant
 * surface together — plus multiple offers per variant, the inert flag, and
 * the `?has_offer` (+ `seller_id` store) product-set scoping.
 */
const OFFER_FIELDS =
  "fields=id,title,variants.id,variants.title,variants.offers.id,variants.offers.sku,variants.offers.seller.id,variants.offers.seller.name"

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Product offer overlay", () => {
      let appContainer: MedusaContainer
      let seller1Headers: any
      let seller2Headers: any
      let seller1Id: string
      let seller2Id: string

      let seedCounter = 0

      const seedProductWithShipping = async (headers: any) => {
        const idx = ++seedCounter
        const tag = `aop${idx}${Date.now()}`
        const product = await api.post(
          `/vendor/products`,
          {
            title: `Offer Product ${tag}`,
            variant_attributes: [
              {
                name: `Axis ${tag}`,
                type: "multi_select",
                values: ["Default"],
                is_variant_axis: true,
              },
            ],
            variants: [
              {
                title: "Default",
                attribute_values: { [`Axis ${tag}`]: "Default" },
              },
            ],
          },
          headers
        )

        const shippingProfile = await api.post(
          `/vendor/shipping-profiles`,
          { name: `Std ${tag}`, type: "default" },
          headers
        )

        return {
          product_id: product.data.product.id as string,
          variant_id: product.data.product.variants[0].id as string,
          shipping_profile_id: shippingProfile.data.shipping_profile
            .id as string,
        }
      }

      const createOffer = async (
        headers: any,
        deps: { variant_id: string; shipping_profile_id: string },
        sku: string,
        amount = 1000
      ) =>
        api.post(
          `/vendor/offers`,
          {
            sku,
            variant_id: deps.variant_id,
            shipping_profile_id: deps.shipping_profile_id,
            inventory_items: [{ required_quantity: 1 }],
            prices: [{ amount, currency_code: "usd" }],
          },
          headers
        )

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const s1 = await createSellerUser(appContainer, {
          email: "seller1@test.com",
          name: "Seller One",
        })
        const s2 = await createSellerUser(appContainer, {
          email: "seller2@test.com",
          name: "Seller Two",
        })
        seller1Headers = s1.headers
        seller2Headers = s2.headers
        seller1Id = s1.seller.id
        seller2Id = s2.seller.id
      })

      describe("wrap on GET /admin/products/:id", () => {
        it("attaches every seller's offer on a shared variant (no isolation)", async () => {
          // Seller 1 owns the product/variant; both sellers offer on it.
          const deps = await seedProductWithShipping(seller1Headers)
          const s1 = await createOffer(seller1Headers, deps, "ADM-SHARE-S1")
          const s2 = await createOffer(seller2Headers, deps, "ADM-SHARE-S2")

          const res = await api.get(
            `/admin/products/${deps.product_id}?${OFFER_FIELDS}`,
            adminHeaders
          )

          expect(res.status).toEqual(200)
          const variant = res.data.product.variants.find(
            (v: any) => v.id === deps.variant_id
          )
          // Both sellers' offers are attached — the admin wrap is NOT
          // seller-scoped (inverse of the vendor isolation test).
          expect(variant.offers).toHaveLength(2)
          const ids = variant.offers.map((o: any) => o.id).sort()
          expect(ids).toEqual([s1.data.offer.id, s2.data.offer.id].sort())
          // Each offer carries its store so the admin Store column resolves.
          const sellerIds = variant.offers.map((o: any) => o.seller?.id).sort()
          expect(sellerIds).toEqual([seller1Id, seller2Id].sort())
        })

        it("keeps multiple offers from one seller on the same variant", async () => {
          const deps = await seedProductWithShipping(seller1Headers)
          const a = await createOffer(seller1Headers, deps, "ADM-MULTI-A", 1000)
          const b = await createOffer(seller1Headers, deps, "ADM-MULTI-B", 2000)

          const res = await api.get(
            `/admin/products/${deps.product_id}?${OFFER_FIELDS}`,
            adminHeaders
          )
          const variant = res.data.product.variants.find(
            (v: any) => v.id === deps.variant_id
          )
          expect(variant.offers).toHaveLength(2)
          expect(variant.offers.map((o: any) => o.id).sort()).toEqual(
            [a.data.offer.id, b.data.offer.id].sort()
          )
        })

        it("does not run the wrap when variants.offers is not requested", async () => {
          const deps = await seedProductWithShipping(seller1Headers)
          await createOffer(seller1Headers, deps, "ADM-NOWRAP-1")

          const res = await api.get(
            `/admin/products/${deps.product_id}?fields=id,title,variants.id,variants.title`,
            adminHeaders
          )
          const variant = res.data.product.variants.find(
            (v: any) => v.id === deps.variant_id
          )
          expect(variant.offers).toBeUndefined()
        })
      })

      describe("?has_offer=true on GET /admin/products", () => {
        it("returns products that have an offer from any seller", async () => {
          const offered = await seedProductWithShipping(seller1Headers)
          await createOffer(seller1Headers, offered, "ADM-HASOFFER-1")
          // A product owned by a seller but with no offer on it.
          const notOffered = await seedProductWithShipping(seller1Headers)

          const res = await api.get(
            `/admin/products?has_offer=true&limit=100&${OFFER_FIELDS}`,
            adminHeaders
          )

          expect(res.status).toEqual(200)
          const ids = res.data.products.map((p: any) => p.id)
          expect(ids).toContain(offered.product_id)
          expect(ids).not.toContain(notOffered.product_id)
        })

        it("scopes the product set to one store with ?seller_id", async () => {
          const s1Product = await seedProductWithShipping(seller1Headers)
          await createOffer(seller1Headers, s1Product, "ADM-SCOPE-S1")
          const s2Product = await seedProductWithShipping(seller2Headers)
          await createOffer(seller2Headers, s2Product, "ADM-SCOPE-S2")

          const res = await api.get(
            `/admin/products?has_offer=true&seller_id=${seller1Id}&limit=100&${OFFER_FIELDS}`,
            adminHeaders
          )

          const ids = res.data.products.map((p: any) => p.id)
          // Only seller 1's offered product is in scope.
          expect(ids).toContain(s1Product.product_id)
          expect(ids).not.toContain(s2Product.product_id)
        })

        it("attaches all sellers' offers on the list rows too", async () => {
          const deps = await seedProductWithShipping(seller1Headers)
          await createOffer(seller1Headers, deps, "ADM-LIST-S1")
          await createOffer(seller2Headers, deps, "ADM-LIST-S2")

          const res = await api.get(
            `/admin/products?has_offer=true&limit=100&${OFFER_FIELDS}`,
            adminHeaders
          )
          const product = res.data.products.find(
            (p: any) => p.id === deps.product_id
          )
          const variant = product.variants.find(
            (v: any) => v.id === deps.variant_id
          )
          expect(variant.offers).toHaveLength(2)
        })
      })
    })
  },
})
