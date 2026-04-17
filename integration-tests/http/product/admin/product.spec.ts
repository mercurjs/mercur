import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { submitSellerProductsWorkflow } from "@mercurjs/core/workflows"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Products", () => {
      let appContainer: MedusaContainer

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(
          dbConnection,
          adminHeaders,
          appContainer
        )
      })

      describe("POST /admin/products", () => {
        it("should create a product", async () => {
          const response = await api.post(
            `/admin/products`,
            { title: "Admin Test Product" },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product).toBeDefined()
          expect(response.data.product.title).toEqual(
            "Admin Test Product"
          )
          expect(response.data.product.status).toEqual("accepted")
          expect(response.data.product.is_active).toEqual(true)
          expect(response.data.product.created_by_actor).toEqual(
            "admin"
          )
        })

        it("should create a product with brand and categories", async () => {
          const brandRes = await api.post(
            `/admin/product-brands`,
            { name: "Test Brand" },
            adminHeaders
          )
          const brandId = brandRes.data.product_brand.id

          const catRes = await api.post(
            `/admin/product-categories`,
            { name: "Test Category" },
            adminHeaders
          )
          const categoryId = catRes.data.product_category.id

          const response = await api.post(
            `/admin/products`,
            {
              title: "Product with Relations",
              brand_id: brandId,
              categories: [{ id: categoryId }],
            },
            adminHeaders
          ).catch(console.log)

          expect(response.status).toEqual(200)
          expect(response.data.product.brand_id).toEqual(brandId)
        })

        it("should create a product with variants", async () => {
          const response = await api.post(
            `/admin/products`,
            {
              title: "Product with Variants",
              variants: [
                { title: "Variant 1", sku: "ADMIN-SKU-001" },
                { title: "Variant 2", sku: "ADMIN-SKU-002" },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.variants).toHaveLength(2)
        })
      })

      describe("GET /admin/products", () => {
        it("should list products", async () => {
          await api.post(
            `/admin/products`,
            { title: "List Test Product" },
            adminHeaders
          )

          const response = await api.get(
            `/admin/products`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.products).toBeDefined()
          expect(response.data.products.length).toBeGreaterThanOrEqual(
            1
          )
          expect(response.data.count).toBeDefined()
          expect(response.data.offset).toBeDefined()
          expect(response.data.limit).toBeDefined()
        })

        it("should filter products by status", async () => {
          await api.post(
            `/admin/products`,
            { title: "Pending Product" },
            adminHeaders
          )

          const response = await api.get(
            `/admin/products?status[]=pending`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(
            response.data.products.every(
              (p: any) => p.status === "pending"
            )
          ).toBe(true)
        })

        it("should search products with q parameter", async () => {
          await api.post(
            `/admin/products`,
            { title: "UniqueSearchableAdmin" },
            adminHeaders
          )

          const response = await api.get(
            `/admin/products?q=UniqueSearchableAdmin`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.products.length).toBeGreaterThanOrEqual(
            1
          )
          expect(
            response.data.products.some(
              (p: any) => p.title === "UniqueSearchableAdmin"
            )
          ).toBe(true)
        })
      })

      describe("GET /admin/products/:id", () => {
        it("should retrieve a product by id", async () => {
          const createRes = await api.post(
            `/admin/products`,
            { title: "Retrieve Me" },
            adminHeaders
          )
          const productId = createRes.data.product.id

          const response = await api.get(
            `/admin/products/${productId}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.id).toEqual(productId)
          expect(response.data.product.title).toEqual("Retrieve Me")
        })

        it("should return 404 for non-existent product", async () => {
          const response = await api
            .get(
              `/admin/products/prod_nonexistent`,
              adminHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("POST /admin/products/:id", () => {
        it("should update a product", async () => {
          const createRes = await api.post(
            `/admin/products`,
            { title: "Before Update" },
            adminHeaders
          )
          const productId = createRes.data.product.id

          const response = await api.post(
            `/admin/products/${productId}`,
            {
              title: "After Update",
              description: "Updated description",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.title).toEqual("After Update")
          expect(response.data.product.description).toEqual(
            "Updated description"
          )
        })
      })

      describe("DELETE /admin/products/:id", () => {
        it("should delete a product", async () => {
          const createRes = await api.post(
            `/admin/products`,
            { title: "Delete Me" },
            adminHeaders
          )
          const productId = createRes.data.product.id

          const response = await api.delete(
            `/admin/products/${productId}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.id).toEqual(productId)
          expect(response.data.object).toEqual("product")
          expect(response.data.deleted).toEqual(true)
        })
      })

      describe("Product Lifecycle (accept, reject, request-changes, activate, deactivate)", () => {
        let productId: string
        let rejectionReasonId: string

        beforeEach(async () => {
          const { seller } = await createSellerUser(appContainer)

          const { result } = await submitSellerProductsWorkflow(
            appContainer
          ).run({
            input: {
              products: [{ title: "Lifecycle Product" }],
              seller_id: seller.id,
            },
          })
          productId = result[0].id

          const reasonRes = await api.post(
            `/admin/product-rejection-reasons`,
            {
              code: `reason-${Date.now()}`,
              label: "Incomplete info",
              type: "temporary",
            },
            adminHeaders
          )
          rejectionReasonId =
            reasonRes.data.product_rejection_reason.id
        })

        it("should accept a pending product", async () => {
          const response = await api.post(
            `/admin/products/${productId}/accept`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.status).toEqual("accepted")
        })

        it("should reject a pending product", async () => {
          const response = await api.post(
            `/admin/products/${productId}/reject`,
            {
              rejection_reason_ids: [rejectionReasonId],
              message: "Not acceptable",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.status).toEqual("rejected")
        })

        it("should request changes on a pending product", async () => {
          const response = await api.post(
            `/admin/products/${productId}/request-changes`,
            {
              rejection_reason_ids: [rejectionReasonId],
              message: "Please fix the images",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.status).toEqual(
            "changes_required"
          )
        })

        it("should activate an accepted product", async () => {
          await api.post(
            `/admin/products/${productId}/accept`,
            {},
            adminHeaders
          )

          const response = await api.post(
            `/admin/products/${productId}/activate`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.is_active).toEqual(true)
        })

        it("should deactivate an active product", async () => {
          await api.post(
            `/admin/products/${productId}/accept`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/products/${productId}/activate`,
            {},
            adminHeaders
          )

          const response = await api.post(
            `/admin/products/${productId}/deactivate`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product.is_active).toEqual(false)
        })
      })

      describe("Product Variants", () => {
        let productId: string

        beforeEach(async () => {
          const createRes = await api.post(
            `/admin/products`,
            { title: "Variant Parent Product" },
            adminHeaders
          )
          productId = createRes.data.product.id
        })

        describe("POST /admin/products/:id/variants", () => {
          it("should create a variant for a product", async () => {
            const response = await api.post(
              `/admin/products/${productId}/variants`,
              {
                title: "New Variant",
                sku: `ADMIN-VAR-${Date.now()}`,
              },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.product).toBeDefined()
            expect(
              response.data.product.variants.some(
                (v: any) => v.title === "New Variant"
              )
            ).toBe(true)
          })
        })

        describe("GET /admin/products/:id/variants", () => {
          it("should list variants for a product", async () => {
            await api.post(
              `/admin/products/${productId}/variants`,
              { title: "Listed Variant", sku: `ADMIN-LIST-${Date.now()}` },
              adminHeaders
            )

            const response = await api.get(
              `/admin/products/${productId}/variants`,
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.variants).toBeDefined()
            expect(
              response.data.variants.length
            ).toBeGreaterThanOrEqual(1)
          })
        })

        describe("DELETE /admin/products/:id/variants/:variant_id", () => {
          it("should delete a variant", async () => {
            const createVarRes = await api.post(
              `/admin/products/${productId}/variants`,
              { title: "To Delete", sku: `ADMIN-DEL-${Date.now()}` },
              adminHeaders
            )
            const variantId =
              createVarRes.data.product.variants.find(
                (v: any) => v.title === "To Delete"
              )?.id

            const response = await api.delete(
              `/admin/products/${productId}/variants/${variantId}`,
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.id).toEqual(variantId)
            expect(response.data.object).toEqual("variant")
            expect(response.data.deleted).toEqual(true)
          })
        })
      })
    })

    describe("Admin - Product Brands", () => {
      let appContainer: MedusaContainer

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(
          dbConnection,
          adminHeaders,
          appContainer
        )
      })

      describe("POST /admin/product-brands", () => {
        it("should create a product brand", async () => {
          const response = await api.post(
            `/admin/product-brands`,
            {
              name: "Nike",
              is_restricted: false,
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_brand).toBeDefined()
          expect(response.data.product_brand.name).toEqual("Nike")
          expect(response.data.product_brand.is_restricted).toEqual(
            false
          )
          expect(response.data.product_brand.handle).toBeDefined()
        })

        it("should create a restricted brand", async () => {
          const response = await api.post(
            `/admin/product-brands`,
            {
              name: "Restricted Brand",
              is_restricted: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_brand.is_restricted).toEqual(
            true
          )
        })
      })

      describe("GET /admin/product-brands", () => {
        it("should list product brands", async () => {
          await api.post(
            `/admin/product-brands`,
            { name: `Brand-List-${Date.now()}` },
            adminHeaders
          )

          const response = await api.get(
            `/admin/product-brands`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_brands).toBeDefined()
          expect(
            response.data.product_brands.length
          ).toBeGreaterThanOrEqual(1)
          expect(response.data.count).toBeDefined()
        })

        it("should search brands with q parameter", async () => {
          await api.post(
            `/admin/product-brands`,
            { name: "UniqueSearchBrand" },
            adminHeaders
          )

          const response = await api.get(
            `/admin/product-brands?q=UniqueSearchBrand`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(
            response.data.product_brands.some(
              (b: any) => b.name === "UniqueSearchBrand"
            )
          ).toBe(true)
        })

        it("should filter brands by is_restricted", async () => {
          await api.post(
            `/admin/product-brands`,
            { name: `Restricted-${Date.now()}`, is_restricted: true },
            adminHeaders
          )

          const response = await api.get(
            `/admin/product-brands?is_restricted=true`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(
            response.data.product_brands.every(
              (b: any) => b.is_restricted === true
            )
          ).toBe(true)
        })
      })

      describe("GET /admin/product-brands/:id", () => {
        it("should retrieve a brand by id", async () => {
          const createRes = await api.post(
            `/admin/product-brands`,
            { name: `Retrieve-Brand-${Date.now()}` },
            adminHeaders
          )
          const brandId = createRes.data.product_brand.id

          const response = await api.get(
            `/admin/product-brands/${brandId}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_brand.id).toEqual(brandId)
        })

        it("should return 404 for non-existent brand", async () => {
          const response = await api
            .get(
              `/admin/product-brands/pbrand_nonexistent`,
              adminHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("POST /admin/product-brands/:id", () => {
        it("should update a brand", async () => {
          const createRes = await api.post(
            `/admin/product-brands`,
            { name: `Update-Brand-${Date.now()}` },
            adminHeaders
          )
          const brandId = createRes.data.product_brand.id

          const response = await api.post(
            `/admin/product-brands/${brandId}`,
            {
              name: "Updated Brand Name",
              is_restricted: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.product_brand.name).toEqual(
            "Updated Brand Name"
          )
          expect(response.data.product_brand.is_restricted).toEqual(
            true
          )
        })
      })

      describe("DELETE /admin/product-brands/:id", () => {
        it("should delete a brand", async () => {
          const createRes = await api.post(
            `/admin/product-brands`,
            { name: `Delete-Brand-${Date.now()}` },
            adminHeaders
          )
          const brandId = createRes.data.product_brand.id

          const response = await api.delete(
            `/admin/product-brands/${brandId}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.id).toEqual(brandId)
          expect(response.data.object).toEqual("product_brand")
          expect(response.data.deleted).toEqual(true)
        })
      })
    })

    // describe("Admin - Product Categories", () => {
    //     let appContainer: MedusaContainer

    //     beforeAll(async () => {
    //         appContainer = getContainer()
    //     })

    //     beforeEach(async () => {
    //         await createAdminUser(
    //             dbConnection,
    //             adminHeaders,
    //             appContainer
    //         )
    //     })

    //     describe("POST /admin/product-categories", () => {
    //         it("should create a product category", async () => {
    //             const response = await api.post(
    //                 `/admin/product-categories`,
    //                 {
    //                     name: "Electronics",
    //                     is_active: true,
    //                 },
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.product_category).toBeDefined()
    //             expect(response.data.product_category.name).toEqual(
    //                 "Electronics"
    //             )
    //             expect(response.data.product_category.is_active).toEqual(
    //                 true
    //             )
    //             expect(
    //                 response.data.product_category.handle
    //             ).toBeDefined()
    //         })

    //         it("should create a child category", async () => {
    //             const parentRes = await api.post(
    //                 `/admin/product-categories`,
    //                 { name: "Parent Category" },
    //                 adminHeaders
    //             )
    //             const parentId = parentRes.data.product_category.id

    //             const response = await api.post(
    //                 `/admin/product-categories`,
    //                 {
    //                     name: "Child Category",
    //                     parent_category_id: parentId,
    //                 },
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_category.parent_category_id
    //             ).toEqual(parentId)
    //         })

    //         it("should create a restricted category", async () => {
    //             const response = await api.post(
    //                 `/admin/product-categories`,
    //                 {
    //                     name: "Restricted Category",
    //                     is_restricted: true,
    //                 },
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_category.is_restricted
    //             ).toEqual(true)
    //         })

    //         it("should create a category with attributes", async () => {
    //             const attrRes = await api.post(
    //                 `/admin/product-attributes`,
    //                 {
    //                     name: "Color",
    //                     type: "single_select",
    //                 },
    //                 adminHeaders
    //             )
    //             const attributeId = attrRes.data.product_attribute.id

    //             const response = await api.post(
    //                 `/admin/product-categories`,
    //                 {
    //                     name: "Category with Attrs",
    //                     attribute_ids: [attributeId],
    //                 },
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_category
    //             ).toBeDefined()
    //         })
    //     })

    //     describe("GET /admin/product-categories", () => {
    //         it("should list product categories", async () => {
    //             await api.post(
    //                 `/admin/product-categories`,
    //                 { name: `Cat-List-${Date.now()}` },
    //                 adminHeaders
    //             )

    //             const response = await api.get(
    //                 `/admin/product-categories`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.product_categories).toBeDefined()
    //             expect(
    //                 response.data.product_categories.length
    //             ).toBeGreaterThanOrEqual(1)
    //             expect(response.data.count).toBeDefined()
    //         })

    //         it("should filter by parent_category_id", async () => {
    //             const parentRes = await api.post(
    //                 `/admin/product-categories`,
    //                 { name: `Parent-${Date.now()}` },
    //                 adminHeaders
    //             )
    //             const parentId = parentRes.data.product_category.id

    //             await api.post(
    //                 `/admin/product-categories`,
    //                 {
    //                     name: `Child-${Date.now()}`,
    //                     parent_category_id: parentId,
    //                 },
    //                 adminHeaders
    //             )

    //             const response = await api.get(
    //                 `/admin/product-categories?parent_category_id=${parentId}`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.product_categories).toHaveLength(1)
    //         })

    //         it("should search categories with q parameter", async () => {
    //             await api.post(
    //                 `/admin/product-categories`,
    //                 { name: "UniqueAdminSearchCat" },
    //                 adminHeaders
    //             )

    //             const response = await api.get(
    //                 `/admin/product-categories?q=UniqueAdminSearchCat`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_categories.length
    //             ).toBeGreaterThanOrEqual(1)
    //         })
    //     })

    //     describe("GET /admin/product-categories/:id", () => {
    //         it("should retrieve a category by id", async () => {
    //             const createRes = await api.post(
    //                 `/admin/product-categories`,
    //                 { name: `Retrieve-Cat-${Date.now()}` },
    //                 adminHeaders
    //             )
    //             const categoryId = createRes.data.product_category.id

    //             const response = await api.get(
    //                 `/admin/product-categories/${categoryId}`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.product_category.id).toEqual(
    //                 categoryId
    //             )
    //         })

    //         it("should return 404 for non-existent category", async () => {
    //             const response = await api
    //                 .get(
    //                     `/admin/product-categories/pcat_nonexistent`,
    //                     adminHeaders
    //                 )
    //                 .catch((e: any) => e.response)

    //             expect(response.status).toEqual(404)
    //         })
    //     })

    //     describe("POST /admin/product-categories/:id", () => {
    //         it("should update a category", async () => {
    //             const createRes = await api.post(
    //                 `/admin/product-categories`,
    //                 { name: `Update-Cat-${Date.now()}` },
    //                 adminHeaders
    //             )
    //             const categoryId = createRes.data.product_category.id

    //             const response = await api.post(
    //                 `/admin/product-categories/${categoryId}`,
    //                 {
    //                     name: "Updated Category",
    //                     is_active: true,
    //                     is_restricted: true,
    //                 },
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.product_category.name).toEqual(
    //                 "Updated Category"
    //             )
    //             expect(
    //                 response.data.product_category.is_active
    //             ).toEqual(true)
    //             expect(
    //                 response.data.product_category.is_restricted
    //             ).toEqual(true)
    //         })
    //     })

    //     describe("DELETE /admin/product-categories/:id", () => {
    //         it("should delete a category", async () => {
    //             const createRes = await api.post(
    //                 `/admin/product-categories`,
    //                 { name: `Delete-Cat-${Date.now()}` },
    //                 adminHeaders
    //             )
    //             const categoryId = createRes.data.product_category.id

    //             const response = await api.delete(
    //                 `/admin/product-categories/${categoryId}`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.id).toEqual(categoryId)
    //             expect(response.data.object).toEqual("product_category")
    //             expect(response.data.deleted).toEqual(true)
    //         })
    //     })

    //     describe("POST /admin/product-categories/:id/products", () => {
    //         it("should add products to a category", async () => {
    //             const catRes = await api.post(
    //                 `/admin/product-categories`,
    //                 { name: `Cat-Products-${Date.now()}` },
    //                 adminHeaders
    //             )
    //             const categoryId = catRes.data.product_category.id

    //             const prodRes = await api.post(
    //                 `/admin/products`,
    //                 { title: "Product for Category" },
    //                 adminHeaders
    //             )
    //             const productId = prodRes.data.product.id

    //             const response = await api.post(
    //                 `/admin/product-categories/${categoryId}/products`,
    //                 { add: [productId] },
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.id).toEqual(categoryId)
    //             expect(response.data.object).toEqual("product_category")
    //         })

    //         it("should remove products from a category", async () => {
    //             const catRes = await api.post(
    //                 `/admin/product-categories`,
    //                 { name: `Cat-Remove-${Date.now()}` },
    //                 adminHeaders
    //             )
    //             const categoryId = catRes.data.product_category.id

    //             const prodRes = await api.post(
    //                 `/admin/products`,
    //                 { title: "Product to Remove" },
    //                 adminHeaders
    //             )
    //             const productId = prodRes.data.product.id

    //             await api.post(
    //                 `/admin/product-categories/${categoryId}/products`,
    //                 { add: [productId] },
    //                 adminHeaders
    //             )

    //             const response = await api.post(
    //                 `/admin/product-categories/${categoryId}/products`,
    //                 { remove: [productId] },
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.id).toEqual(categoryId)
    //         })
    //     })
    // })

    // describe("Admin - Product Attributes", () => {
    //     let appContainer: MedusaContainer

    //     beforeAll(async () => {
    //         appContainer = getContainer()
    //     })

    //     beforeEach(async () => {
    //         await createAdminUser(
    //             dbConnection,
    //             adminHeaders,
    //             appContainer
    //         )
    //     })

    //     describe("POST /admin/product-attributes", () => {
    //         it("should create a product attribute", async () => {
    //             const response = await api.post(
    //                 `/admin/product-attributes`,
    //                 {
    //                     name: "Color",
    //                     type: "single_select",
    //                 },
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.product_attribute).toBeDefined()
    //             expect(response.data.product_attribute.name).toEqual(
    //                 "Color"
    //             )
    //             expect(response.data.product_attribute.type).toEqual(
    //                 "single_select"
    //             )
    //             expect(
    //                 response.data.product_attribute.handle
    //             ).toBeDefined()
    //         })

    //         it("should create a variant axis attribute", async () => {
    //             const response = await api.post(
    //                 `/admin/product-attributes`,
    //                 {
    //                     name: "Size",
    //                     type: "single_select",
    //                     is_variant_axis: true,
    //                     is_filterable: true,
    //                 },
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_attribute.is_variant_axis
    //             ).toEqual(true)
    //             expect(
    //                 response.data.product_attribute.is_filterable
    //             ).toEqual(true)
    //         })

    //         it("should create attributes of different types", async () => {
    //             const types = [
    //                 "single_select",
    //                 "multi_select",
    //                 "text",
    //                 "toggle",
    //                 "unit",
    //             ]

    //             for (const type of types) {
    //                 const response = await api.post(
    //                     `/admin/product-attributes`,
    //                     {
    //                         name: `Attr-${type}-${Date.now()}`,
    //                         type,
    //                     },
    //                     adminHeaders
    //                 )

    //                 expect(response.status).toEqual(200)
    //                 expect(response.data.product_attribute.type).toEqual(
    //                     type
    //                 )
    //             }
    //         })
    //     })

    //     describe("GET /admin/product-attributes", () => {
    //         it("should list global product attributes", async () => {
    //             await api.post(
    //                 `/admin/product-attributes`,
    //                 { name: `Global-Attr-${Date.now()}`, type: "text" },
    //                 adminHeaders
    //             )

    //             const response = await api.get(
    //                 `/admin/product-attributes`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.product_attributes).toBeDefined()
    //             expect(
    //                 response.data.product_attributes.length
    //             ).toBeGreaterThanOrEqual(1)
    //             expect(response.data.count).toBeDefined()
    //         })

    //         it("should filter by type", async () => {
    //             await api.post(
    //                 `/admin/product-attributes`,
    //                 { name: `Toggle-Attr-${Date.now()}`, type: "toggle" },
    //                 adminHeaders
    //             )

    //             const response = await api.get(
    //                 `/admin/product-attributes?type[]=toggle`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_attributes.every(
    //                     (a: any) => a.type === "toggle"
    //                 )
    //             ).toBe(true)
    //         })

    //         it("should filter by is_variant_axis", async () => {
    //             await api.post(
    //                 `/admin/product-attributes`,
    //                 {
    //                     name: `Axis-Attr-${Date.now()}`,
    //                     type: "single_select",
    //                     is_variant_axis: true,
    //                 },
    //                 adminHeaders
    //             )

    //             const response = await api.get(
    //                 `/admin/product-attributes?is_variant_axis=true`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_attributes.every(
    //                     (a: any) => a.is_variant_axis === true
    //                 )
    //             ).toBe(true)
    //         })
    //     })

    //     describe("GET /admin/product-attributes/:id", () => {
    //         it("should retrieve an attribute by id", async () => {
    //             const createRes = await api.post(
    //                 `/admin/product-attributes`,
    //                 { name: `Retrieve-Attr-${Date.now()}`, type: "text" },
    //                 adminHeaders
    //             )
    //             const attributeId = createRes.data.product_attribute.id

    //             const response = await api.get(
    //                 `/admin/product-attributes/${attributeId}`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.product_attribute.id).toEqual(
    //                 attributeId
    //             )
    //         })

    //         it("should return 404 for non-existent attribute", async () => {
    //             const response = await api
    //                 .get(
    //                     `/admin/product-attributes/pattr_nonexistent`,
    //                     adminHeaders
    //                 )
    //                 .catch((e: any) => e.response)

    //             expect(response.status).toEqual(404)
    //         })
    //     })

    //     describe("POST /admin/product-attributes/:id", () => {
    //         it("should update an attribute", async () => {
    //             const createRes = await api.post(
    //                 `/admin/product-attributes`,
    //                 { name: `Update-Attr-${Date.now()}`, type: "text" },
    //                 adminHeaders
    //             )
    //             const attributeId = createRes.data.product_attribute.id

    //             const response = await api.post(
    //                 `/admin/product-attributes/${attributeId}`,
    //                 {
    //                     name: "Updated Attribute",
    //                     is_filterable: true,
    //                     is_active: false,
    //                 },
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.product_attribute.name).toEqual(
    //                 "Updated Attribute"
    //             )
    //             expect(
    //                 response.data.product_attribute.is_filterable
    //             ).toEqual(true)
    //             expect(
    //                 response.data.product_attribute.is_active
    //             ).toEqual(false)
    //         })
    //     })

    //     describe("DELETE /admin/product-attributes/:id", () => {
    //         it("should delete an attribute", async () => {
    //             const createRes = await api.post(
    //                 `/admin/product-attributes`,
    //                 { name: `Delete-Attr-${Date.now()}`, type: "text" },
    //                 adminHeaders
    //             )
    //             const attributeId = createRes.data.product_attribute.id

    //             const response = await api.delete(
    //                 `/admin/product-attributes/${attributeId}`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.id).toEqual(attributeId)
    //             expect(response.data.object).toEqual("product_attribute")
    //             expect(response.data.deleted).toEqual(true)
    //         })
    //     })

    //     describe("Attribute Values", () => {
    //         let attributeId: string

    //         beforeEach(async () => {
    //             const createRes = await api.post(
    //                 `/admin/product-attributes`,
    //                 {
    //                     name: `Select-Attr-${Date.now()}`,
    //                     type: "single_select",
    //                 },
    //                 adminHeaders
    //             )
    //             attributeId = createRes.data.product_attribute.id
    //         })

    //         describe("POST /admin/product-attributes/:id/values", () => {
    //             it("should create a value for an attribute", async () => {
    //                 const response = await api.post(
    //                     `/admin/product-attributes/${attributeId}/values`,
    //                     { name: "Red" },
    //                     adminHeaders
    //                 )

    //                 expect(response.status).toEqual(200)
    //                 expect(
    //                     response.data.product_attribute
    //                 ).toBeDefined()
    //                 expect(
    //                     response.data.product_attribute.values.some(
    //                         (v: any) => v.name === "Red"
    //                     )
    //                 ).toBe(true)
    //             })

    //             it("should create multiple values", async () => {
    //                 await api.post(
    //                     `/admin/product-attributes/${attributeId}/values`,
    //                     { name: "Blue" },
    //                     adminHeaders
    //                 )
    //                 await api.post(
    //                     `/admin/product-attributes/${attributeId}/values`,
    //                     { name: "Green" },
    //                     adminHeaders
    //                 )

    //                 const response = await api.get(
    //                     `/admin/product-attributes/${attributeId}`,
    //                     adminHeaders
    //                 )

    //                 expect(response.status).toEqual(200)
    //                 const valueNames =
    //                     response.data.product_attribute.values.map(
    //                         (v: any) => v.name
    //                     )
    //                 expect(valueNames).toContain("Blue")
    //                 expect(valueNames).toContain("Green")
    //             })
    //         })

    //         describe("POST /admin/product-attributes/:id/values/:value_id", () => {
    //             it("should update a value", async () => {
    //                 const createValRes = await api.post(
    //                     `/admin/product-attributes/${attributeId}/values`,
    //                     { name: "Original Value" },
    //                     adminHeaders
    //                 )
    //                 const valueId =
    //                     createValRes.data.product_attribute.values.find(
    //                         (v: any) => v.name === "Original Value"
    //                     )?.id

    //                 const response = await api.post(
    //                     `/admin/product-attributes/${attributeId}/values/${valueId}`,
    //                     { name: "Updated Value" },
    //                     adminHeaders
    //                 )

    //                 expect(response.status).toEqual(200)
    //                 expect(
    //                     response.data.product_attribute.values.some(
    //                         (v: any) => v.name === "Updated Value"
    //                     )
    //                 ).toBe(true)
    //             })
    //         })

    //         describe("DELETE /admin/product-attributes/:id/values/:value_id", () => {
    //             it("should delete a value", async () => {
    //                 const createValRes = await api.post(
    //                     `/admin/product-attributes/${attributeId}/values`,
    //                     { name: "Delete Me Value" },
    //                     adminHeaders
    //                 )
    //                 const valueId =
    //                     createValRes.data.product_attribute.values.find(
    //                         (v: any) => v.name === "Delete Me Value"
    //                     )?.id

    //                 const response = await api.delete(
    //                     `/admin/product-attributes/${attributeId}/values/${valueId}`,
    //                     adminHeaders
    //                 )

    //                 expect(response.status).toEqual(200)
    //                 expect(
    //                     response.data.product_attribute.values.some(
    //                         (v: any) => v.id === valueId
    //                     )
    //                 ).toBe(false)
    //             })
    //         })
    //     })
    // })

    // describe("Admin - Product Rejection Reasons", () => {
    //     let appContainer: MedusaContainer

    //     beforeAll(async () => {
    //         appContainer = getContainer()
    //     })

    //     beforeEach(async () => {
    //         await createAdminUser(
    //             dbConnection,
    //             adminHeaders,
    //             appContainer
    //         )
    //     })

    //     describe("POST /admin/product-rejection-reasons", () => {
    //         it("should create a temporary rejection reason", async () => {
    //             const response = await api.post(
    //                 `/admin/product-rejection-reasons`,
    //                 {
    //                     code: `incomplete-info-${Date.now()}`,
    //                     label: "Incomplete Information",
    //                     type: "temporary",
    //                 },
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_rejection_reason
    //             ).toBeDefined()
    //             expect(
    //                 response.data.product_rejection_reason.label
    //             ).toEqual("Incomplete Information")
    //             expect(
    //                 response.data.product_rejection_reason.type
    //             ).toEqual("temporary")
    //             expect(
    //                 response.data.product_rejection_reason.is_active
    //             ).toEqual(true)
    //         })

    //         it("should create a permanent rejection reason", async () => {
    //             const response = await api.post(
    //                 `/admin/product-rejection-reasons`,
    //                 {
    //                     code: `prohibited-item-${Date.now()}`,
    //                     label: "Prohibited Item",
    //                     type: "permanent",
    //                 },
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_rejection_reason.type
    //             ).toEqual("permanent")
    //         })
    //     })

    //     describe("GET /admin/product-rejection-reasons", () => {
    //         it("should list rejection reasons", async () => {
    //             await api.post(
    //                 `/admin/product-rejection-reasons`,
    //                 {
    //                     code: `list-reason-${Date.now()}`,
    //                     label: "List Reason",
    //                     type: "temporary",
    //                 },
    //                 adminHeaders
    //             )

    //             const response = await api.get(
    //                 `/admin/product-rejection-reasons`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_rejection_reasons
    //             ).toBeDefined()
    //             expect(
    //                 response.data.product_rejection_reasons.length
    //             ).toBeGreaterThanOrEqual(1)
    //             expect(response.data.count).toBeDefined()
    //         })

    //         it("should filter by type", async () => {
    //             await api.post(
    //                 `/admin/product-rejection-reasons`,
    //                 {
    //                     code: `perm-reason-${Date.now()}`,
    //                     label: "Permanent Reason",
    //                     type: "permanent",
    //                 },
    //                 adminHeaders
    //             )

    //             const response = await api.get(
    //                 `/admin/product-rejection-reasons?type[]=permanent`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_rejection_reasons.every(
    //                     (r: any) => r.type === "permanent"
    //                 )
    //             ).toBe(true)
    //         })

    //         it("should search with q parameter", async () => {
    //             await api.post(
    //                 `/admin/product-rejection-reasons`,
    //                 {
    //                     code: `unique-searchable-${Date.now()}`,
    //                     label: "UniqueSearchableReason",
    //                     type: "temporary",
    //                 },
    //                 adminHeaders
    //             )

    //             const response = await api.get(
    //                 `/admin/product-rejection-reasons?q=UniqueSearchableReason`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_rejection_reasons.length
    //             ).toBeGreaterThanOrEqual(1)
    //         })

    //         it("should filter by is_active", async () => {
    //             await api.post(
    //                 `/admin/product-rejection-reasons`,
    //                 {
    //                     code: `active-reason-${Date.now()}`,
    //                     label: "Active Reason",
    //                     type: "temporary",
    //                     is_active: true,
    //                 },
    //                 adminHeaders
    //             )

    //             const response = await api.get(
    //                 `/admin/product-rejection-reasons?is_active=true`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_rejection_reasons.every(
    //                     (r: any) => r.is_active === true
    //                 )
    //             ).toBe(true)
    //         })
    //     })

    //     describe("GET /admin/product-rejection-reasons/:id", () => {
    //         it("should retrieve a rejection reason by id", async () => {
    //             const createRes = await api.post(
    //                 `/admin/product-rejection-reasons`,
    //                 {
    //                     code: `retrieve-reason-${Date.now()}`,
    //                     label: "Retrieve Reason",
    //                     type: "temporary",
    //                 },
    //                 adminHeaders
    //             )
    //             const reasonId =
    //                 createRes.data.product_rejection_reason.id

    //             const response = await api.get(
    //                 `/admin/product-rejection-reasons/${reasonId}`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_rejection_reason.id
    //             ).toEqual(reasonId)
    //             expect(
    //                 response.data.product_rejection_reason.label
    //             ).toEqual("Retrieve Reason")
    //         })

    //         it("should return 404 for non-existent reason", async () => {
    //             const response = await api
    //                 .get(
    //                     `/admin/product-rejection-reasons/prejreason_nonexistent`,
    //                     adminHeaders
    //                 )
    //                 .catch((e: any) => e.response)

    //             expect(response.status).toEqual(404)
    //         })
    //     })

    //     describe("POST /admin/product-rejection-reasons/:id", () => {
    //         it("should update a rejection reason", async () => {
    //             const createRes = await api.post(
    //                 `/admin/product-rejection-reasons`,
    //                 {
    //                     code: `update-reason-${Date.now()}`,
    //                     label: "Original Label",
    //                     type: "temporary",
    //                 },
    //                 adminHeaders
    //             )
    //             const reasonId =
    //                 createRes.data.product_rejection_reason.id

    //             const response = await api.post(
    //                 `/admin/product-rejection-reasons/${reasonId}`,
    //                 {
    //                     label: "Updated Label",
    //                     type: "permanent",
    //                     is_active: false,
    //                 },
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(
    //                 response.data.product_rejection_reason.label
    //             ).toEqual("Updated Label")
    //             expect(
    //                 response.data.product_rejection_reason.type
    //             ).toEqual("permanent")
    //             expect(
    //                 response.data.product_rejection_reason.is_active
    //             ).toEqual(false)
    //         })
    //     })

    //     describe("DELETE /admin/product-rejection-reasons/:id", () => {
    //         it("should delete a rejection reason", async () => {
    //             const createRes = await api.post(
    //                 `/admin/product-rejection-reasons`,
    //                 {
    //                     code: `delete-reason-${Date.now()}`,
    //                     label: "Delete Reason",
    //                     type: "temporary",
    //                 },
    //                 adminHeaders
    //             )
    //             const reasonId =
    //                 createRes.data.product_rejection_reason.id

    //             const response = await api.delete(
    //                 `/admin/product-rejection-reasons/${reasonId}`,
    //                 adminHeaders
    //             )

    //             expect(response.status).toEqual(200)
    //             expect(response.data.id).toEqual(reasonId)
    //             expect(response.data.object).toEqual(
    //                 "product_rejection_reason"
    //             )
    //             expect(response.data.deleted).toEqual(true)
    //         })
    //     })
    // })
  },
})
