import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

const mediaImage = (i: number) => `http://example.com/category-media-${i}.png`
const iconImage = (i: number) => `http://example.com/category-icon-${i}.svg`

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Product Category media & icon", () => {
      let appContainer: MedusaContainer

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      const gallery = (images: any[]) =>
        images.filter((img: any) => !img.type)
      const icon = (images: any[]) =>
        images.find((img: any) => img.type === "icon")

      it("creates a category with a media gallery (thumbnail + banner) and an icon", async () => {
        const response = await api.post(
          "/admin/product-categories",
          {
            name: "Menswear",
            media: [
              { url: mediaImage(1), is_thumbnail: true, is_banner: true },
              { url: mediaImage(2) },
            ],
            icon: iconImage(1),
          },
          adminHeaders
        )

        expect(response.status).toEqual(200)

        const images = response.data.product_category.media_images
        expect(images).toBeDefined()

        const galleryImages = gallery(images)
        const iconImg = icon(images)

        expect(galleryImages).toHaveLength(2)
        expect(iconImg).toBeDefined()
        expect(iconImg.url).toEqual(iconImage(1))

        const thumbnail = galleryImages.find((img: any) => img.is_thumbnail)
        const banner = galleryImages.find((img: any) => img.is_banner)
        expect(thumbnail.url).toEqual(mediaImage(1))
        expect(banner.url).toEqual(mediaImage(1))
        expect(galleryImages.filter((img: any) => img.is_thumbnail)).toHaveLength(1)
        expect(galleryImages.filter((img: any) => img.is_banner)).toHaveLength(1)
      })

      it("returns linked images on GET", async () => {
        const created = await api.post(
          "/admin/product-categories",
          { name: "Shoes", media: [{ url: mediaImage(1) }], icon: iconImage(1) },
          adminHeaders
        )
        const id = created.data.product_category.id

        const response = await api.get(
          `/admin/product-categories/${id}`,
          adminHeaders
        )

        expect(response.status).toEqual(200)
        const images = response.data.product_category.media_images
        expect(gallery(images)).toHaveLength(1)
        expect(icon(images)).toBeDefined()
      })

      it("updates media + icon and keeps the single thumbnail/banner/icon invariants", async () => {
        const created = await api.post(
          "/admin/product-categories",
          {
            name: "Accessories",
            media: [{ url: mediaImage(1), is_thumbnail: true, is_banner: true }],
            icon: iconImage(1),
          },
          adminHeaders
        )
        const id = created.data.product_category.id

        // Move thumbnail + banner to a different image, replace the icon.
        const updated = await api.post(
          `/admin/product-categories/${id}`,
          {
            media: [
              { url: mediaImage(2), is_thumbnail: true },
              { url: mediaImage(3), is_banner: true },
            ],
            icon: iconImage(2),
          },
          adminHeaders
        )

        expect(updated.status).toEqual(200)
        const images = updated.data.product_category.media_images
        const galleryImages = gallery(images)

        expect(galleryImages).toHaveLength(2)
        expect(galleryImages.filter((img: any) => img.is_thumbnail)).toHaveLength(1)
        expect(galleryImages.filter((img: any) => img.is_banner)).toHaveLength(1)
        expect(
          galleryImages.find((img: any) => img.is_thumbnail).url
        ).toEqual(mediaImage(2))
        expect(galleryImages.find((img: any) => img.is_banner).url).toEqual(
          mediaImage(3)
        )

        const iconImages = images.filter((img: any) => img.type === "icon")
        expect(iconImages).toHaveLength(1)
        expect(iconImages[0].url).toEqual(iconImage(2))
      })

      it("clears the icon when icon is null and keeps the gallery untouched", async () => {
        const created = await api.post(
          "/admin/product-categories",
          { name: "Bags", media: [{ url: mediaImage(1) }], icon: iconImage(1) },
          adminHeaders
        )
        const id = created.data.product_category.id

        const updated = await api.post(
          `/admin/product-categories/${id}`,
          { icon: null },
          adminHeaders
        )

        const images = updated.data.product_category.media_images
        expect(icon(images)).toBeUndefined()
        expect(gallery(images)).toHaveLength(1)
      })

      it("removes the linked images when the category is deleted", async () => {
        const created = await api.post(
          "/admin/product-categories",
          { name: "Outlet", media: [{ url: mediaImage(1) }], icon: iconImage(1) },
          adminHeaders
        )
        const id = created.data.product_category.id
        const imageIds = created.data.product_category.media_images.map(
          (img: any) => img.id
        )
        expect(imageIds.length).toEqual(2)

        const deleted = await api.delete(
          `/admin/product-categories/${id}`,
          adminHeaders
        )
        expect(deleted.status).toEqual(200)
        expect(deleted.data.deleted).toEqual(true)

        const mediaService: any = appContainer.resolve("media")
        const remaining = await mediaService.listMediaImages({ id: imageIds })
        expect(remaining).toHaveLength(0)
      })
    })
  },
})
