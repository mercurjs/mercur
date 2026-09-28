import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  MercurModules,
  ProductChangeActionType,
  ProductChangeStatus,
} from "@mercurjs/types"

import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

type Headers = { headers: Record<string, string> }

type OfferRow = { id: string; deleted_at: Date | null }

type OfferService = {
  listOffers: (
    filters: Record<string, unknown>,
    config: Record<string, unknown>
  ) => Promise<OfferRow[]>
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Product delete cascades to offers", () => {
      let container: MedusaContainer
      let sellerHeaders: Headers
      let otherSellerHeaders: Headers

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)

        const a = await createSellerUser(container, {
          email: "delete-cascade-seller@test.com",
          name: "Delete Cascade Seller",
        })
        sellerHeaders = a.headers

        const b = await createSellerUser(container, {
          email: "delete-cascade-seller2@test.com",
          name: "Delete Cascade Seller Two",
        })
        otherSellerHeaders = b.headers
      })

      const createOffer = async (
        headers: Headers,
        variantId: string,
        sku: string
      ) => {
        const sp = await api.post(
          `/vendor/shipping-profiles`,
          { name: `Standard ${sku}`, type: "default" },
          headers
        )
        const res = await api.post(
          `/vendor/offers`,
          {
            sku,
            variant_id: variantId,
            shipping_profile_id: sp.data.shipping_profile.id,
            inventory_items: [{}],
            prices: [{ amount: 1000, currency_code: "usd" }],
          },
          headers
        )
        return res.data.offer.id as string
      }

      const listOffersWithDeleted = (productId: string) =>
        container
          .resolve<OfferService>(MercurModules.OFFER)
          .listOffers({ product_id: productId }, { withDeleted: true })

      it("admin DELETE soft-deletes the product and every offer on it", async () => {
        const product = await createVendorProduct(api, sellerHeaders, {
          title: `Cascade Admin ${Date.now()}`,
          variants: [{ title: "Default" }],
        })
        const variantId = product.variants[0].id

        const offerIds = [
          await createOffer(sellerHeaders, variantId, "CASCADE-ADMIN-1"),
          await createOffer(otherSellerHeaders, variantId, "CASCADE-ADMIN-2"),
        ]

        const res = await api.delete(
          `/admin/products/${product.id}`,
          adminHeaders
        )
        expect(res.status).toEqual(200)
        expect(res.data).toEqual({
          id: product.id,
          object: "product",
          deleted: true,
        })

        const got = await api
          .get(`/admin/products/${product.id}`, adminHeaders)
          .catch((e) => e.response)
        expect(got.status).toEqual(404)

        const offers = await listOffersWithDeleted(product.id)
        expect(offers.map((o) => o.id).sort()).toEqual(offerIds.sort())
        expect(offers.every((o) => o.deleted_at !== null)).toBe(true)

        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const { data: changes } = await query.graph({
          entity: "product_change",
          fields: ["id", "status", "actions.action"],
          filters: { product_id: product.id },
        })
        const deleteChange = (
          changes as Array<{ status: string; actions: { action: string }[] }>
        ).find((c) =>
          c.actions.some(
            (a) => a.action === ProductChangeActionType.PRODUCT_DELETE
          )
        )
        expect(deleteChange?.status).toEqual(ProductChangeStatus.CONFIRMED)
      })

      it("admin DELETE of a product without offers still deletes it", async () => {
        const product = await createVendorProduct(api, sellerHeaders, {
          title: `Cascade No Offers ${Date.now()}`,
          variants: [{ title: "Default" }],
        })

        const res = await api.delete(
          `/admin/products/${product.id}`,
          adminHeaders
        )
        expect(res.status).toEqual(200)

        const got = await api
          .get(`/admin/products/${product.id}`, adminHeaders)
          .catch((e) => e.response)
        expect(got.status).toEqual(404)
      })

      it("confirmed vendor PRODUCT_DELETE soft-deletes offers on the product", async () => {
        const product = await createVendorProduct(api, sellerHeaders, {
          title: `Cascade Vendor ${Date.now()}`,
          variants: [{ title: "Default" }],
        })
        const offerId = await createOffer(
          sellerHeaders,
          product.variants[0].id,
          "CASCADE-VENDOR-1"
        )

        const res = await api.delete(
          `/vendor/products/${product.id}`,
          sellerHeaders
        )
        expect(res.status).toEqual(202)

        const offers = await listOffersWithDeleted(product.id)
        expect(offers).toHaveLength(1)
        expect(offers[0].id).toEqual(offerId)
        expect(offers[0].deleted_at).not.toBeNull()

        const list = await api.get(`/admin/offers`, adminHeaders)
        expect(
          (list.data.offers as Array<{ id: string }>).some(
            (o) => o.id === offerId
          )
        ).toBe(false)
      })

      it("leaves offers on other products untouched", async () => {
        const doomed = await createVendorProduct(api, sellerHeaders, {
          title: `Cascade Doomed ${Date.now()}`,
          variants: [{ title: "Default" }],
        })
        const kept = await createVendorProduct(api, sellerHeaders, {
          title: `Cascade Kept ${Date.now()}`,
          variants: [{ title: "Default" }],
        })
        await createOffer(sellerHeaders, doomed.variants[0].id, "CASCADE-DOOMED")
        const keptOfferId = await createOffer(
          sellerHeaders,
          kept.variants[0].id,
          "CASCADE-KEPT"
        )

        await api.delete(`/admin/products/${doomed.id}`, adminHeaders)

        const offers = await listOffersWithDeleted(kept.id)
        expect(offers).toHaveLength(1)
        expect(offers[0].id).toEqual(keptOfferId)
        expect(offers[0].deleted_at).toBeNull()
      })
    })
  },
})
