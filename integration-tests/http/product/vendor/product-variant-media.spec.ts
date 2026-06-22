import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"

import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60_000)

/**
 * Vendor variant media (MER-137). Variant images are existing product
 * images linked through the product↔variant junction. The vendor selects
 * which product images belong to a variant; the variant update carries an
 * `images: { add, remove }` diff (mirroring Medusa's batch endpoint) that
 * `applyVariantImageLinksStep` links/unlinks. The test env runs with
 * `MEDUSA_FF_PRODUCT_REQUEST=false`, so each staged `VARIANT_UPDATE`
 * auto-confirms inline and the links are applied in the same request.
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

      // Create a product seeded with two general images plus one variant.
      const seed = async (): Promise<{
        productId: string
        variantId: string
        imageIdA: string
        imageIdB: string
      }> => {
        const productRes = await api.post(
          `/vendor/products`,
          {
            title: "Variant Media Product",
            images: [{ url: IMG_A }, { url: IMG_B }],
          },
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

        const productImagesRes = await api.get(
          `/vendor/products/${productId}?fields=images.id,images.url`,
          sellerHeaders
        )
        const images = productImagesRes.data.product.images as Array<{
          id: string
          url: string
        }>
        const imageIdA = images.find((i) => i.url === IMG_A)!.id
        const imageIdB = images.find((i) => i.url === IMG_B)!.id

        return { productId, variantId, imageIdA, imageIdB }
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

      it("links selected product images to the variant and sets its thumbnail", async () => {
        const { productId, variantId, imageIdA, imageIdB } = await seed()

        // Initially no images are linked to the variant.
        expect(linkedImageUrls(await getVariant(productId, variantId))).toEqual(
          []
        )

        const res = await api.post(
          `/vendor/products/${productId}/variants/${variantId}`,
          { images: { add: [imageIdA, imageIdB] }, thumbnail: IMG_A },
          sellerHeaders
        )
        expect(res.status).toBe(202)

        const variant = await getVariant(productId, variantId)
        expect(linkedImageUrls(variant)).toEqual([IMG_A, IMG_B].sort())
        expect(variant.thumbnail).toBe(IMG_A)
      })

      it("unlinks an image from the variant without removing it from the product", async () => {
        const { productId, variantId, imageIdA, imageIdB } = await seed()

        await api.post(
          `/vendor/products/${productId}/variants/${variantId}`,
          { images: { add: [imageIdA, imageIdB] } },
          sellerHeaders
        )

        const seeded = await getVariant(productId, variantId)
        expect(linkedImageUrls(seeded)).toEqual([IMG_A, IMG_B].sort())

        // Unlink image B.
        await api.post(
          `/vendor/products/${productId}/variants/${variantId}`,
          { images: { remove: [imageIdB] } },
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
