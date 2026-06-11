import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"

import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60_000)

/**
 * Vendor variant media (MER-137). Exercises the variant-scoped image
 * flow added on top of the product-change apply path. The test env runs
 * with `MEDUSA_FF_PRODUCT_REQUEST=false`, so each staged `VARIANT_UPDATE`
 * auto-confirms inline and `reconcileVariantImagesStep` links/unlinks the
 * product↔variant images in the same request.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor /vendor/products/:id/variants/:variant_id — media", () => {
      let container: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }

      const IMG_A = "https://example.com/variant-a.jpg"
      const IMG_B = "https://example.com/variant-b.jpg"

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        const a = await createSellerUser(container, {
          email: "variant-media-seller@test.com",
          name: "Variant Media Seller",
        })
        sellerHeaders = a.headers
      })

      const createProductWithVariant = async (): Promise<{
        productId: string
        variantId: string
      }> => {
        const productRes = await api.post(
          `/vendor/products`,
          { title: "Variant Media Product" },
          sellerHeaders
        )
        const productId = productRes.data.product.id as string

        await api.post(
          `/vendor/products/${productId}/variants`,
          { title: "Media Variant" },
          sellerHeaders
        )

        const listRes = await api.get(
          `/vendor/products/${productId}/variants`,
          sellerHeaders
        )
        const variantId = listRes.data.variants[0].id as string

        return { productId, variantId }
      }

      const getVariant = async (productId: string, variantId: string) => {
        const res = await api.get(
          `/vendor/products/${productId}/variants/${variantId}?fields=id,thumbnail,images.id,images.url,images.variants.id`,
          sellerHeaders
        )
        return res.data.variant as {
          id: string
          thumbnail?: string | null
          images?: Array<{
            id: string
            url: string
            variants?: Array<{ id: string }> | null
          }>
        }
      }

      // Images actually linked to the variant via the junction (general
      // product images are excluded).
      const linkedImageUrls = (
        variant: Awaited<ReturnType<typeof getVariant>>
      ): string[] =>
        (variant.images ?? [])
          .filter((image) =>
            (image.variants ?? []).some((v) => v.id === variant.id)
          )
          .map((image) => image.url)
          .sort()

      it("links uploaded images to the variant and sets its thumbnail", async () => {
        const { productId, variantId } = await createProductWithVariant()

        const res = await api.post(
          `/vendor/products/${productId}/variants/${variantId}`,
          { images: [{ url: IMG_A }, { url: IMG_B }], thumbnail: IMG_A },
          sellerHeaders
        )
        expect(res.status).toBe(202)

        const variant = await getVariant(productId, variantId)
        expect(linkedImageUrls(variant)).toEqual([IMG_A, IMG_B].sort())
        expect(variant.thumbnail).toBe(IMG_A)

        // Variant images are product images, so they also surface on the
        // product's image pool.
        const productRes = await api.get(
          `/vendor/products/${productId}?fields=images.url`,
          sellerHeaders
        )
        const productUrls = (
          productRes.data.product.images ?? ([] as Array<{ url: string }>)
        ).map((i: { url: string }) => i.url)
        expect(productUrls).toEqual(expect.arrayContaining([IMG_A, IMG_B]))
      })

      it("unlinks an image from the variant when it is dropped from the set", async () => {
        const { productId, variantId } = await createProductWithVariant()

        await api.post(
          `/vendor/products/${productId}/variants/${variantId}`,
          { images: [{ url: IMG_A }, { url: IMG_B }] },
          sellerHeaders
        )

        const seeded = await getVariant(productId, variantId)
        expect(linkedImageUrls(seeded)).toEqual([IMG_A, IMG_B].sort())
        const imageA = (seeded.images ?? []).find((i) => i.url === IMG_A)!
        expect(imageA).toBeDefined()

        // Re-submit with only image A — image B should be unlinked.
        await api.post(
          `/vendor/products/${productId}/variants/${variantId}`,
          { images: [{ id: imageA.id, url: IMG_A }] },
          sellerHeaders
        )

        const variant = await getVariant(productId, variantId)
        expect(linkedImageUrls(variant)).toEqual([IMG_A])

        // The dropped image stays on the product (only the link is removed).
        const productRes = await api.get(
          `/vendor/products/${productId}?fields=images.url`,
          sellerHeaders
        )
        const productUrls = (
          productRes.data.product.images ?? ([] as Array<{ url: string }>)
        ).map((i: { url: string }) => i.url)
        expect(productUrls).toEqual(expect.arrayContaining([IMG_A, IMG_B]))
      })
    })
  },
})
