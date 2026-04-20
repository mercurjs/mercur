import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    let appContainer: MedusaContainer
    let sellerHeaders: Record<string, any>
    let sellerId: string

    beforeAll(async () => {
      appContainer = getContainer()
    })

    beforeEach(async () => {
      await createAdminUser(dbConnection, adminHeaders, appContainer)
      const { seller, headers } = await createSellerUser(appContainer)
      sellerHeaders = headers
      sellerId = seller.id
    })

    describe("Vendor - Product Attributes", () => {
      describe("GET /vendor/product-attributes", () => {
        it("should list seller-scoped attributes", async () => {
          const response = await api.get(
            `/vendor/product-attributes`,
            sellerHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_attributes).toBeDefined()
          expect(response.data.count).toBeDefined()
          expect(response.data.offset).toBeDefined()
          expect(response.data.limit).toBeDefined()
        })

        it("should return attributes created by admin", async () => {
          await api.post(
            `/admin/product-attributes`,
            { name: "Admin Color", type: "single_select" },
            adminHeaders
          )

          const response = await api.get(
            `/vendor/product-attributes`,
            sellerHeaders
          )

          expect(response.status).toEqual(200)
          expect(
            response.data.product_attributes.some(
              (a: any) => a.created_by === sellerId
            )
          ).toBe(false)
        })
      })

      describe("GET /vendor/product-attributes/:id", () => {
        it("should retrieve an attribute by id", async () => {
          const createRes = await api.post(
            `/admin/product-attributes`,
            { name: "Retrieve Attr", type: "text" },
            adminHeaders
          )
          const attrId = createRes.data.product_attribute.id

          const response = await api.get(
            `/vendor/product-attributes/${attrId}`,
            sellerHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_attribute.id).toEqual(attrId)
          expect(response.data.product_attribute.name).toEqual(
            "Retrieve Attr"
          )
        })

        it("should return 404 for non-existent attribute", async () => {
          const response = await api
            .get(
              `/vendor/product-attributes/pattr_nonexistent`,
              sellerHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toEqual(404)
        })
      })
    })

    describe("Vendor - Product Brands", () => {
      describe("GET /vendor/product-brands", () => {
        it("should list brands", async () => {
          await api.post(
            `/admin/product-brands`,
            { name: `Brand-${Date.now()}` },
            adminHeaders
          )

          const response = await api.get(
            `/vendor/product-brands`,
            sellerHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_brands).toBeDefined()
          expect(
            response.data.product_brands.length
          ).toBeGreaterThanOrEqual(1)
          expect(response.data.count).toBeDefined()
        })
      })

      describe("GET /vendor/product-brands/:id", () => {
        it("should retrieve a brand by id", async () => {
          const createRes = await api.post(
            `/admin/product-brands`,
            { name: `Retrieve-Brand-${Date.now()}` },
            adminHeaders
          )
          const brandId = createRes.data.product_brand.id

          const response = await api.get(
            `/vendor/product-brands/${brandId}`,
            sellerHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_brand.id).toEqual(brandId)
        })

        it("should return 404 for non-existent brand", async () => {
          const response = await api
            .get(
              `/vendor/product-brands/pbrand_nonexistent`,
              sellerHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toEqual(404)
        })
      })
    })

    describe("Vendor - Product Categories", () => {
      describe("GET /vendor/product-categories", () => {
        it("should list categories", async () => {
          await api.post(
            `/admin/product-categories`,
            { name: "Vendor Visible Category" },
            adminHeaders
          )

          const response = await api.get(
            `/vendor/product-categories`,
            sellerHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_categories).toBeDefined()
          expect(
            response.data.product_categories.length
          ).toBeGreaterThanOrEqual(1)
          expect(response.data.count).toBeDefined()
        })
      })

      describe("GET /vendor/product-categories/:id", () => {
        it("should retrieve a category by id", async () => {
          const createRes = await api.post(
            `/admin/product-categories`,
            { name: `Retrieve-Cat-${Date.now()}` },
            adminHeaders
          )
          const categoryId = createRes.data.product_category.id

          const response = await api.get(
            `/vendor/product-categories/${categoryId}`,
            sellerHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_category.id).toEqual(categoryId)
        })

        it("should return 404 for non-existent category", async () => {
          const response = await api
            .get(
              `/vendor/product-categories/pcat_nonexistent`,
              sellerHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toEqual(404)
        })
      })
    })

    describe("Vendor - Products", () => {
      describe("POST /vendor/products", () => {
        it("should create a product", async () => {
          const response = await api.post(
            `/vendor/products`,
            { title: "Vendor Test Product" },
            sellerHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.product).toBeDefined()
          expect(response.data.product.title).toEqual(
            "Vendor Test Product"
          )
        })

        it("should create a product with variants", async () => {
          const response = await api.post(
            `/vendor/products`,
            {
              title: "Product with Variants",
              variants: [
                { title: "Variant 1", sku: `VSKU-${Date.now()}-001` },
                { title: "Variant 2", sku: `VSKU-${Date.now()}-002` },
              ],
            },
            sellerHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.product.variants).toHaveLength(2)
        })
      })

      describe("GET /vendor/products", () => {
        it("should list products", async () => {
          await api.post(
            `/vendor/products`,
            { title: "List Test Product" },
            sellerHeaders
          )

          const response = await api.get(
            `/vendor/products`,
            sellerHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.products).toBeDefined()
          expect(
            response.data.products.length
          ).toBeGreaterThanOrEqual(1)
          expect(response.data.count).toBeDefined()
          expect(response.data.offset).toBeDefined()
          expect(response.data.limit).toBeDefined()
        })
      })
    })
  },
})
