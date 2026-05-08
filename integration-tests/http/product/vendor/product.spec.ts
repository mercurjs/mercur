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
        it("should list attributes", async () => {
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

    describe("Vendor - Product Edits", () => {
      let productId: string
      let variantId: string

      beforeEach(async () => {
        // Submit a product with one variant via the seller workflow,
        // then publish so the initial pending change becomes CONFIRMED
        // and we can stage subsequent edit requests.
        const { result } = await submitSellerProductsWorkflow(
          appContainer
        ).run({
          input: {
            products: [
              {
                title: "Edit Test Product",
                variants: [
                  {
                    title: "Original Variant",
                    sku: `V-EDIT-${Date.now()}`,
                  },
                ],
              } as any,
            ],
            seller_id: sellerId,
          },
        })
        productId = result[0].id
        variantId = (result[0] as any).variants[0].id

        await api.post(
          `/admin/products/${productId}/confirm`,
          {},
          adminHeaders
        )
      })

      // --- UPDATE (top-level Product fields) ---
      describe("POST /vendor/products/:id (UPDATE action)", () => {
        it("should stage an UPDATE action and return 202 with the pending change", async () => {
          const response = await api.post(
            `/vendor/products/${productId}`,
            { title: "Renamed Product" },
            sellerHeaders
          )

          expect(response.status).toEqual(202)
          expect(response.data.product_change).toBeDefined()
          expect(response.data.product_change.product_id).toEqual(
            productId
          )
          expect(response.data.product_change.status).toEqual("pending")
        })

        it("should NOT mutate the product before confirmation", async () => {
          await api.post(
            `/vendor/products/${productId}`,
            { title: "Pending Title" },
            sellerHeaders
          )

          const productRes = await api.get(
            `/admin/products/${productId}`,
            adminHeaders
          )
          expect(productRes.data.product.title).toEqual(
            "Edit Test Product"
          )
        })

        it("should reject when the product already has a pending change", async () => {
          await api.post(
            `/vendor/products/${productId}`,
            { title: "First Edit" },
            sellerHeaders
          )

          const response = await api
            .post(
              `/vendor/products/${productId}`,
              { subtitle: "Second Edit" },
              sellerHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })

        it("should reject a no-op update (no field differs)", async () => {
          const response = await api
            .post(
              `/vendor/products/${productId}`,
              { title: "Edit Test Product" },
              sellerHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      // --- VARIANT_ADD ---
      describe("POST /vendor/products/:id/variants (VARIANT_ADD action)", () => {
        it("should stage a VARIANT_ADD action", async () => {
          const response = await api.post(
            `/vendor/products/${productId}/variants`,
            { title: "Staged Variant", sku: `V-STAGE-${Date.now()}` },
            sellerHeaders
          )

          expect(response.status).toEqual(202)
          expect(response.data.product_change).toBeDefined()
          expect(response.data.product_change.product_id).toEqual(
            productId
          )
        })

        it("should NOT create the variant before confirmation", async () => {
          const beforeRes = await api.get(
            `/admin/products/${productId}/variants`,
            adminHeaders
          )
          const beforeCount = beforeRes.data.variants.length

          await api.post(
            `/vendor/products/${productId}/variants`,
            { title: "Pending Variant", sku: `V-PEND-${Date.now()}` },
            sellerHeaders
          )

          const afterRes = await api.get(
            `/admin/products/${productId}/variants`,
            adminHeaders
          )
          expect(afterRes.data.variants.length).toEqual(beforeCount)
        })
      })

      // --- VARIANT_UPDATE ---
      describe("POST /vendor/products/:id/variants/:variant_id (VARIANT_UPDATE action)", () => {
        it("should stage a VARIANT_UPDATE action", async () => {
          const response = await api.post(
            `/vendor/products/${productId}/variants/${variantId}`,
            { title: "Updated Variant Title" },
            sellerHeaders
          )

          expect(response.status).toEqual(202)
          expect(response.data.product_change.product_id).toEqual(
            productId
          )
        })

        it("should NOT mutate the variant before confirmation", async () => {
          await api.post(
            `/vendor/products/${productId}/variants/${variantId}`,
            { title: "Should Not Apply Yet" },
            sellerHeaders
          )

          const variantRes = await api.get(
            `/admin/products/${productId}/variants/${variantId}`,
            adminHeaders
          )
          expect(variantRes.data.variant.title).toEqual(
            "Original Variant"
          )
        })

        it("should reject when no field differs", async () => {
          const response = await api
            .post(
              `/vendor/products/${productId}/variants/${variantId}`,
              { title: "Original Variant" },
              sellerHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })

        it("should 404 for a variant that does not belong to the product", async () => {
          const response = await api
            .post(
              `/vendor/products/${productId}/variants/variant_nonexistent`,
              { title: "Nope" },
              sellerHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      // --- VARIANT_REMOVE ---
      describe("DELETE /vendor/products/:id/variants/:variant_id (VARIANT_REMOVE action)", () => {
        it("should stage a VARIANT_REMOVE action", async () => {
          const response = await api.delete(
            `/vendor/products/${productId}/variants/${variantId}`,
            sellerHeaders
          )

          expect(response.status).toEqual(202)
          expect(response.data.product_change.product_id).toEqual(
            productId
          )
        })

        it("should NOT delete the variant before confirmation", async () => {
          await api.delete(
            `/vendor/products/${productId}/variants/${variantId}`,
            sellerHeaders
          )

          const variantRes = await api.get(
            `/admin/products/${productId}/variants/${variantId}`,
            adminHeaders
          )
          expect(variantRes.data.variant.id).toEqual(variantId)
        })
      })

      // --- ATTRIBUTE_ADD ---
      describe("POST /vendor/products/:id/attributes (ATTRIBUTE_ADD action)", () => {
        let attributeId: string

        beforeEach(async () => {
          const res = await api.post(
            `/admin/product-attributes`,
            {
              name: `Color-${Date.now()}`,
              type: "single_select",
              values: [{ name: "Red" }, { name: "Blue" }],
            },
            adminHeaders
          )
          attributeId = res.data.product_attribute.id
        })

        it("should stage an ATTRIBUTE_ADD action", async () => {
          const response = await api.post(
            `/vendor/products/${productId}/attributes`,
            { attribute_id: attributeId, values: ["Red"] },
            sellerHeaders
          )

          expect(response.status).toEqual(202)
          expect(response.data.product_change.product_id).toEqual(
            productId
          )
        })

        it("should reject when attribute_id is missing", async () => {
          const response = await api
            .post(
              `/vendor/products/${productId}/attributes`,
              {},
              sellerHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      // --- ATTRIBUTE_REMOVE ---
      describe("DELETE /vendor/products/:id/attributes/:attribute_id (ATTRIBUTE_REMOVE action)", () => {
        it("should stage an ATTRIBUTE_REMOVE action", async () => {
          // The workflow stages the action without verifying the
          // attribute is currently linked — apply-time would surface the
          // mismatch. Use a dummy id to assert staging behavior.
          const response = await api.delete(
            `/vendor/products/${productId}/attributes/pattr_dummy_${Date.now()}`,
            sellerHeaders
          )

          expect(response.status).toEqual(202)
          expect(response.data.product_change.product_id).toEqual(
            productId
          )
        })
      })

      // --- PRODUCT_DELETE ---
      describe("DELETE /vendor/products/:id (PRODUCT_DELETE action)", () => {
        it("should stage a PRODUCT_DELETE action", async () => {
          const response = await api.delete(
            `/vendor/products/${productId}`,
            sellerHeaders
          )

          expect(response.status).toEqual(202)
          expect(response.data.product_change).toBeDefined()
          expect(response.data.product_change.product_id).toEqual(
            productId
          )
          expect(response.data.product_change.status).toEqual("pending")
        })

        it("should NOT delete the product before confirmation", async () => {
          await api.delete(
            `/vendor/products/${productId}`,
            sellerHeaders
          )

          const productRes = await api.get(
            `/admin/products/${productId}`,
            adminHeaders
          )
          expect(productRes.status).toEqual(200)
          expect(productRes.data.product.id).toEqual(productId)
        })

        it("should reject when a pending change already exists", async () => {
          await api.post(
            `/vendor/products/${productId}`,
            { title: "First Edit" },
            sellerHeaders
          )

          const response = await api
            .delete(`/vendor/products/${productId}`, sellerHeaders)
            .catch((e: any) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      // --- One pending change at a time (cross-action) ---
      describe("Sequential constraint", () => {
        it("should reject staging a different action while one is pending", async () => {
          await api.post(
            `/vendor/products/${productId}`,
            { title: "First Edit" },
            sellerHeaders
          )

          const response = await api
            .post(
              `/vendor/products/${productId}/variants`,
              { title: "Should Not Stage", sku: `V-X-${Date.now()}` },
              sellerHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      // --- End-to-end: stage -> confirm ---
      describe("Admin confirm flow", () => {
        it("should apply staged UPDATE actions on confirm", async () => {
          const stageRes = await api.post(
            `/vendor/products/${productId}`,
            { title: "Confirmed Title" },
            sellerHeaders
          )
          const changeId = stageRes.data.product_change.id

          // Admin can inspect what's pending
          const pendingRes = await api.get(
            `/admin/products/${productId}/change`,
            adminHeaders
          )
          expect(pendingRes.data.product_change.id).toEqual(changeId)

          // Confirm
          const confirmRes = await api.post(
            `/admin/product-changes/${changeId}/confirm`,
            { internal_note: "Approved" },
            adminHeaders
          )
          expect(confirmRes.status).toEqual(200)
          expect(confirmRes.data).toEqual({
            id: changeId,
            object: "product_change",
            deleted: true,
          })

          // Product is now mutated
          const productRes = await api.get(
            `/admin/products/${productId}`,
            adminHeaders
          )
          expect(productRes.data.product.title).toEqual(
            "Confirmed Title"
          )

          // Subsequent edits are now allowed
          const next = await api.post(
            `/vendor/products/${productId}`,
            { subtitle: "Follow-up Edit" },
            sellerHeaders
          )
          expect(next.status).toEqual(202)
        })

        it("should apply staged VARIANT_ADD actions on confirm", async () => {
          const stageRes = await api.post(
            `/vendor/products/${productId}/variants`,
            {
              title: "Confirmed Variant",
              sku: `V-CONF-${Date.now()}`,
            },
            sellerHeaders
          )
          const changeId = stageRes.data.product_change.id

          await api.post(
            `/admin/product-changes/${changeId}/confirm`,
            {},
            adminHeaders
          )

          const variantsRes = await api.get(
            `/admin/products/${productId}/variants`,
            adminHeaders
          )
          expect(
            variantsRes.data.variants.some(
              (v: any) => v.title === "Confirmed Variant"
            )
          ).toBe(true)
        })

        it("should apply staged VARIANT_UPDATE actions on confirm", async () => {
          const stageRes = await api.post(
            `/vendor/products/${productId}/variants/${variantId}`,
            { title: "Renamed Variant" },
            sellerHeaders
          )
          const changeId = stageRes.data.product_change.id

          await api.post(
            `/admin/product-changes/${changeId}/confirm`,
            {},
            adminHeaders
          )

          const variantRes = await api.get(
            `/admin/products/${productId}/variants/${variantId}`,
            adminHeaders
          )
          expect(variantRes.data.variant.title).toEqual("Renamed Variant")
        })

        it("should apply staged VARIANT_REMOVE actions on confirm", async () => {
          const stageRes = await api.delete(
            `/vendor/products/${productId}/variants/${variantId}`,
            sellerHeaders
          )
          const changeId = stageRes.data.product_change.id

          await api.post(
            `/admin/product-changes/${changeId}/confirm`,
            {},
            adminHeaders
          )

          const response = await api
            .get(
              `/admin/products/${productId}/variants/${variantId}`,
              adminHeaders
            )
            .catch((e: any) => e.response)

          expect(response.status).toEqual(404)
        })

        it("should apply staged ATTRIBUTE_ADD actions on confirm", async () => {
          const attrRes = await api.post(
            `/admin/product-attributes`,
            {
              name: `Material-${Date.now()}`,
              type: "single_select",
              values: [{ name: "Cotton" }, { name: "Wool" }],
            },
            adminHeaders
          )
          const attributeId = attrRes.data.product_attribute.id

          const stageRes = await api.post(
            `/vendor/products/${productId}/attributes`,
            { attribute_id: attributeId, values: ["Cotton"] },
            sellerHeaders
          )
          const changeId = stageRes.data.product_change.id

          await api.post(
            `/admin/product-changes/${changeId}/confirm`,
            {},
            adminHeaders
          )

          const productRes = await api.get(
            `/admin/products/${productId}`,
            adminHeaders
          )
          expect(
            (productRes.data.product.attribute_values ?? []).some(
              (v: any) =>
                v.attribute?.id === attributeId ||
                v.attribute_id === attributeId
            )
          ).toBe(true)
        })

        it("should soft-delete the product when a PRODUCT_DELETE action is confirmed", async () => {
          const stageRes = await api.delete(
            `/vendor/products/${productId}`,
            sellerHeaders
          )
          const changeId = stageRes.data.product_change.id

          const confirmRes = await api.post(
            `/admin/product-changes/${changeId}/confirm`,
            {},
            adminHeaders
          )
          expect(confirmRes.status).toEqual(200)
          expect(confirmRes.data).toEqual({
            id: changeId,
            object: "product_change",
            deleted: true,
          })

          const response = await api
            .get(`/admin/products/${productId}`, adminHeaders)
            .catch((e: any) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      // --- Admin cancel flow ---
      describe("Admin cancel flow", () => {
        it("should NOT mutate the product when a change is canceled", async () => {
          const stageRes = await api.post(
            `/vendor/products/${productId}`,
            { title: "Will Be Canceled" },
            sellerHeaders
          )
          const changeId = stageRes.data.product_change.id

          const cancelRes = await api.post(
            `/admin/product-changes/${changeId}/cancel`,
            { internal_note: "Not aligned" },
            adminHeaders
          )
          expect(cancelRes.status).toEqual(200)
          expect(cancelRes.data.product_change.status).toEqual(
            "canceled"
          )
          expect(cancelRes.data.product_change.internal_note).toEqual(
            "Not aligned"
          )

          const productRes = await api.get(
            `/admin/products/${productId}`,
            adminHeaders
          )
          expect(productRes.data.product.title).toEqual(
            "Edit Test Product"
          )

          // Seller can stage a new change after cancellation
          const next = await api.post(
            `/vendor/products/${productId}`,
            { title: "Second Try" },
            sellerHeaders
          )
          expect(next.status).toEqual(202)
        })
      })
    })
  },
})
