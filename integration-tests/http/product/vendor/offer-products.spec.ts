import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

/**
 * Coverage for the vendor product endpoint's offer overlay
 * (`wrapProductVariantsWithOffers` + the `?has_offer=true` seller-offered
 * filter) — the backend slice of SPEC-009. The Offers surface reads the
 * vendor product endpoint with `variants.offers.*`; these assert that the
 * wrap attaches only the active seller's offers, that a competitor's
 * offers on a shared variant never leak, that multiple offers per variant
 * are kept, that the flag is inert when not requested, and that
 * `?has_offer=true` scopes the list to the seller's offered products.
 */
const OFFER_FIELDS =
  "fields=id,title,variants.id,variants.title,variants.offers.id,variants.offers.sku,variants.offers.prices.amount"

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Product offer overlay", () => {
      let appContainer: MedusaContainer
      let seller1Headers: any
      let seller2Headers: any

      let seedCounter = 0

      const seedProductWithShipping = async (headers: any) => {
        const idx = ++seedCounter
        const tag = `op${idx}${Date.now()}`
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

      describe("wrap on GET /vendor/products/:id", () => {
        it("attaches the seller's offer to its variant; other variants are empty", async () => {
          const deps = await seedProductWithShipping(seller1Headers)
          const created = await createOffer(seller1Headers, deps, "WRAP-1")
          const offerId = created.data.offer.id

          const res = await api.get(
            `/vendor/products/${deps.product_id}?${OFFER_FIELDS}`,
            seller1Headers
          )

          expect(res.status).toEqual(200)
          const variant = res.data.product.variants.find(
            (v: any) => v.id === deps.variant_id
          )
          expect(variant.offers).toHaveLength(1)
          expect(variant.offers[0]).toEqual(
            expect.objectContaining({ id: offerId, sku: "WRAP-1" })
          )
        })

        it("includes the offer's inventory link in the wrap (for the bulk stock grid)", async () => {
          const deps = await seedProductWithShipping(seller1Headers)
          await createOffer(seller1Headers, deps, "INV-LINK-1")

          const res = await api.get(
            `/vendor/products/${deps.product_id}?${OFFER_FIELDS}`,
            seller1Headers
          )
          const variant = res.data.product.variants.find(
            (v: any) => v.id === deps.variant_id
          )
          expect(variant.offers).toHaveLength(1)
          // The wrap returns the offer's `inventory_item_link` (with
          // location-level fields) so the bulk Edit Stock Levels grid can seed.
          expect(variant.offers[0]).toHaveProperty("inventory_item_link")
          expect(Array.isArray(variant.offers[0].inventory_item_link)).toBe(true)
        })

        it("does not leak a competitor's offer on the same shared variant", async () => {
          // Seller 1 owns the product/variant; both sellers make an offer
          // on that same variant (the marketplace's shared-variant case).
          const deps = await seedProductWithShipping(seller1Headers)
          const s1 = await createOffer(seller1Headers, deps, "SHARE-S1")
          const s2 = await createOffer(seller2Headers, deps, "SHARE-S2")

          const r1 = await api.get(
            `/vendor/products/${deps.product_id}?${OFFER_FIELDS}`,
            seller1Headers
          )
          const v1 = r1.data.product.variants.find(
            (v: any) => v.id === deps.variant_id
          )
          expect(v1.offers).toHaveLength(1)
          expect(v1.offers[0].id).toEqual(s1.data.offer.id)

          const r2 = await api.get(
            `/vendor/products/${deps.product_id}?${OFFER_FIELDS}`,
            seller2Headers
          )
          const v2 = r2.data.product.variants.find(
            (v: any) => v.id === deps.variant_id
          )
          expect(v2.offers).toHaveLength(1)
          expect(v2.offers[0].id).toEqual(s2.data.offer.id)
        })

        it("keeps multiple offers from one seller on the same variant (distinct skus)", async () => {
          const deps = await seedProductWithShipping(seller1Headers)
          const a = await createOffer(seller1Headers, deps, "MULTI-A", 1000)
          const b = await createOffer(seller1Headers, deps, "MULTI-B", 2000)

          const res = await api.get(
            `/vendor/products/${deps.product_id}?${OFFER_FIELDS}`,
            seller1Headers
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
          await createOffer(seller1Headers, deps, "NOWRAP-1")

          const res = await api.get(
            `/vendor/products/${deps.product_id}?fields=id,title,variants.id,variants.title`,
            seller1Headers
          )
          const variant = res.data.product.variants.find(
            (v: any) => v.id === deps.variant_id
          )
          expect(variant.offers).toBeUndefined()
        })
      })

      describe("?has_offer=true on GET /vendor/products", () => {
        it("returns only products the seller has an offer on", async () => {
          const offered = await seedProductWithShipping(seller1Headers)
          await createOffer(seller1Headers, offered, "HASOFFER-1")
          // A second product the seller owns but has NOT made an offer on.
          const notOffered = await seedProductWithShipping(seller1Headers)

          const res = await api.get(
            `/vendor/products?has_offer=true&limit=100&${OFFER_FIELDS}`,
            seller1Headers
          )

          expect(res.status).toEqual(200)
          const ids = res.data.products.map((p: any) => p.id)
          expect(ids).toContain(offered.product_id)
          expect(ids).not.toContain(notOffered.product_id)
        })

        it("scopes per seller — a competitor's offered product is excluded", async () => {
          const s1Product = await seedProductWithShipping(seller1Headers)
          await createOffer(seller1Headers, s1Product, "SCOPE-S1")
          const s2Product = await seedProductWithShipping(seller2Headers)
          await createOffer(seller2Headers, s2Product, "SCOPE-S2")

          const res = await api.get(
            `/vendor/products?has_offer=true&limit=100&${OFFER_FIELDS}`,
            seller1Headers
          )
          const ids = res.data.products.map((p: any) => p.id)
          expect(ids).toContain(s1Product.product_id)
          expect(ids).not.toContain(s2Product.product_id)
        })
      })
    })
  },
})
