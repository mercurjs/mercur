import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - publishing enforces required category attributes", () => {
      let appContainer: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }
      let categoryId: string
      let attributeId: string
      let valueId: string

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const seller = await createSellerUser(appContainer, {
          email: "required-attrs-seller@test.com",
          name: "Required Attrs Seller",
        })
        sellerHeaders = seller.headers

        const category = await api.post(
          "/admin/product-categories",
          { name: "Shirts", is_active: true },
          adminHeaders,
        )
        categoryId = category.data.product_category.id

        const attribute = await api.post(
          "/admin/product-attributes",
          {
            name: "Required size",
            handle: "required-size",
            type: "single_select",
            is_required: true,
            is_active: true,
            category_ids: [categoryId],
            values: [{ name: "M" }],
          },
          adminHeaders,
        )
        attributeId = attribute.data.product_attribute.id
        valueId = attribute.data.product_attribute.values[0].id
      })

      const submitVendorProduct = async (
        handle: string,
        attributes?: { id: string; value_ids: string[] }[],
      ) => {
        const response = await api.post(
          "/vendor/products",
          {
            title: handle,
            handle,
            status: "proposed",
            categories: [{ id: categoryId }],
            variants: [{ title: "Default variant" }],
            ...(attributes ? { attributes } : {}),
          },
          sellerHeaders,
        )
        expect(response.status).toEqual(201)
        return response.data.product.id as string
      }

      const getStatus = async (productId: string) =>
        (await api.get(`/admin/products/${productId}`, adminHeaders)).data
          .product.status

      it("rejects confirming a proposed product missing a required category attribute", async () => {
        const productId = await submitVendorProduct("missing-required")

        const error = await api
          .post(`/admin/products/${productId}/confirm`, {}, adminHeaders)
          .catch((e) => e)

        expect(error.response.status).toEqual(400)
        expect(error.response.data.message).toContain("Required size")
        expect(await getStatus(productId)).toEqual("proposed")
      })

      it("confirms a proposed product that has the required attribute", async () => {
        const productId = await submitVendorProduct("has-required", [
          { id: attributeId, value_ids: [valueId] },
        ])

        const response = await api.post(
          `/admin/products/${productId}/confirm`,
          {},
          adminHeaders,
        )

        expect(response.status).toEqual(200)
        expect(await getStatus(productId)).toEqual("published")
      })

      it("rejects creating a published product missing a required category attribute", async () => {
        const error = await api
          .post(
            "/admin/products",
            {
              title: "Admin missing required",
              status: "published",
              categories: [{ id: categoryId }],
              variants: [{ title: "Default variant" }],
            },
            adminHeaders,
          )
          .catch((e) => e)

        expect(error.response.status).toEqual(400)
        expect(error.response.data.message).toContain("Required size")
      })

      it("allows creating a draft product missing a required category attribute", async () => {
        const response = await api.post(
          "/admin/products",
          {
            title: "Admin draft",
            status: "draft",
            categories: [{ id: categoryId }],
            variants: [{ title: "Default variant" }],
          },
          adminHeaders,
        )

        expect(response.status).toEqual(200)
        expect(response.data.product.status).toEqual("draft")
      })

      it("rejects updating a product to published while a required category attribute is missing", async () => {
        const created = await api.post(
          "/admin/products",
          {
            title: "Admin draft to publish",
            status: "draft",
            categories: [{ id: categoryId }],
            variants: [{ title: "Default variant" }],
          },
          adminHeaders,
        )
        const productId = created.data.product.id

        const error = await api
          .post(
            `/admin/products/${productId}`,
            { status: "published" },
            adminHeaders,
          )
          .catch((e) => e)

        expect(error.response.status).toEqual(400)
        expect(error.response.data.message).toContain("Required size")
        expect(await getStatus(productId)).toEqual("draft")
      })

      it("ignores required attributes linked to other categories", async () => {
        const other = await api.post(
          "/admin/product-categories",
          { name: "Mugs", is_active: true },
          adminHeaders,
        )

        const response = await api.post(
          "/admin/products",
          {
            title: "Mug",
            status: "published",
            categories: [{ id: other.data.product_category.id }],
            variants: [{ title: "Default variant" }],
          },
          adminHeaders,
        )

        expect(response.status).toEqual(200)
        expect(response.data.product.status).toEqual("published")
      })
    })
  },
})
