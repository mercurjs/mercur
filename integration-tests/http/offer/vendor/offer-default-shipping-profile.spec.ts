import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Offer default shipping profile from product category", () => {
      let appContainer: MedusaContainer
      let headers: { headers: Record<string, string> }
      let stockLocationId: string

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const seller = await createSellerUser(appContainer, {
          email: `profile-${Date.now()}@test.com`,
          name: "Profile Seller",
        })
        headers = seller.headers

        stockLocationId = (
          await api.post(
            `/vendor/stock-locations`,
            { name: "Main warehouse" },
            headers
          )
        ).data.stock_location.id
      })

      const createCategory = async (
        name: string,
        parent_category_id?: string
      ) =>
        (
          await api.post(
            "/admin/product-categories",
            { name, ...(parent_category_id ? { parent_category_id } : {}) },
            adminHeaders
          )
        ).data.product_category

      const setCategoryProfile = (
        categoryId: string,
        shipping_profile_id: string | null
      ) =>
        api.post(
          `/admin/product-categories/${categoryId}/shipping-profile`,
          { shipping_profile_id },
          adminHeaders
        )

      const createProductInCategory = async (categoryId: string) => {
        const product = await createVendorProduct(api, headers, {
          title: `Product ${Date.now()}`,
        })
        await api.post(
          `/admin/product-categories/${categoryId}/products`,
          { add: [product.id] },
          adminHeaders
        )
        return product
      }

      const createOffer = async (
        variantId: string,
        shipping_profile_id?: string
      ) =>
        (
          await api.post(
            "/vendor/offers",
            {
              sku: `SKU-${Date.now()}-${Math.random()}`,
              variant_id: variantId,
              ...(shipping_profile_id ? { shipping_profile_id } : {}),
              inventory_items: [
                {
                  stock_levels: [
                    { location_id: stockLocationId, stocked_quantity: 10 },
                  ],
                },
              ],
              prices: [{ amount: 1000, currency_code: "usd" }],
            },
            headers
          )
        ).data.offer

      it("sets, returns and clears a category default shipping profile", async () => {
        const profile = await createShippingProfile(appContainer, {
          name: "Bulky",
          type: "custom",
        })
        const category = await createCategory("Sofas")

        const set = await setCategoryProfile(category.id, profile.id)
        expect(set.status).toEqual(200)
        expect(set.data.product_category.default_shipping_profile).toEqual(
          expect.objectContaining({ id: profile.id, name: "Bulky" })
        )

        const cleared = await setCategoryProfile(category.id, null)
        expect(cleared.data.product_category.default_shipping_profile).toBeFalsy()
      })

      it("uses the offer's own shipping profile when provided", async () => {
        const bulky = await createShippingProfile(appContainer, {
          name: "Bulky",
          type: "custom",
        })
        const small = await createShippingProfile(appContainer, {
          name: "Small",
          type: "custom",
        })
        const category = await createCategory("Sofas")
        await setCategoryProfile(category.id, bulky.id)
        const product = await createProductInCategory(category.id)

        const offer = await createOffer(product.variants[0].id, small.id)
        expect(offer.shipping_profile_id).toEqual(small.id)
      })

      it("inherits the category's profile, falling back to the nearest ancestor", async () => {
        const bulky = await createShippingProfile(appContainer, {
          name: "Bulky",
          type: "custom",
        })
        const furniture = await createCategory("Furniture")
        const sofas = await createCategory("Sofas", furniture.id)
        await setCategoryProfile(furniture.id, bulky.id)

        const product = await createProductInCategory(sofas.id)
        const offer = await createOffer(product.variants[0].id)
        expect(offer.shipping_profile_id).toEqual(bulky.id)

        const fragile = await createShippingProfile(appContainer, {
          name: "Fragile",
          type: "custom",
        })
        await setCategoryProfile(sofas.id, fragile.id)
        const second = await createProductInCategory(sofas.id)
        const secondOffer = await createOffer(second.variants[0].id)
        expect(secondOffer.shipping_profile_id).toEqual(fragile.id)
      })

      it("re-resolves the category profile when an offer's profile is cleared", async () => {
        const bulky = await createShippingProfile(appContainer, {
          name: "Bulky",
          type: "custom",
        })
        const small = await createShippingProfile(appContainer, {
          name: "Small",
          type: "custom",
        })
        const category = await createCategory("Sofas")
        await setCategoryProfile(category.id, bulky.id)
        const product = await createProductInCategory(category.id)

        const offer = await createOffer(product.variants[0].id, small.id)
        expect(offer.shipping_profile_id).toEqual(small.id)

        const updated = await api.post(
          `/vendor/offers/${offer.id}`,
          { shipping_profile_id: null },
          headers
        )
        expect(updated.data.offer.shipping_profile_id).toEqual(bulky.id)
      })

      it("falls back to the store default shipping profile", async () => {
        const fulfillment = appContainer.resolve(Modules.FULFILLMENT)
        let [defaultProfile] = await fulfillment.listShippingProfiles({
          type: "default",
        })
        if (!defaultProfile) {
          defaultProfile = await createShippingProfile(appContainer, {
            name: "Default",
            type: "default",
          })
        }

        const category = await createCategory("Uncategorised")
        const product = await createProductInCategory(category.id)
        const offer = await createOffer(product.variants[0].id)
        expect(offer.shipping_profile_id).toEqual(defaultProfile.id)
      })
    })
  },
})
