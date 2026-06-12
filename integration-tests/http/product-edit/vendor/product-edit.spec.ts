import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  MercurModules,
  ProductChangeActionType,
  ProductChangeStatus,
} from "@mercurjs/types"

import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60_000)

/**
 * Vendor product-edit HTTP coverage — mirrors the canary flow
 * documented in `product-edit.md`. The test env runs with
 * `MEDUSA_FF_PRODUCT_REQUEST=false`, so the vendor staging workflows
 * auto-confirm inline (`autoConfirmProductChangeWorkflow`). To still
 * exercise the PENDING / admin-approval path, suites that need a
 * PENDING change seed one directly via the `product_change` module
 * service before hitting the cancel/preview endpoints.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor /vendor/products/:id — product-edit flow (SPEC-008)", () => {
      let container: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }
      let otherSellerHeaders: { headers: Record<string, string> }

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        const a = await createSellerUser(container, {
          email: "edit-seller@test.com",
          name: "Edit Seller",
        })
        sellerHeaders = a.headers
        const b = await createSellerUser(container, {
          email: "other-seller@test.com",
          name: "Other Seller",
        })
        otherSellerHeaders = b.headers
      })

      const createVendorProduct = async (
        title: string,
        headers = sellerHeaders,
      ): Promise<string> => {
        const res = await api.post(
          `/vendor/products`,
          { title },
          headers,
        )
        return res.data.product.id
      }

      const listChanges = async (productId: string) => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_change",
          fields: ["id", "status", "product_id", "created_by", "actions.*"],
          filters: { product_id: productId },
        })
        return data as Array<{
          id: string
          status: string
          product_id?: string
          created_by?: string
          actions: Array<{ action: string; details: Record<string, unknown> }>
        }>
      }

      const seedPendingChange = async (
        productId: string,
        sellerId: string,
        actions: Array<{ action: ProductChangeActionType; details: Record<string, unknown> }>,
      ): Promise<string> => {
        const service: any = container.resolve(MercurModules.PRODUCT_EDIT)
        const [change] = await service.createProductChanges([
          {
            product_id: productId,
            created_by: sellerId,
            status: ProductChangeStatus.PENDING,
          },
        ])
        await service.createProductChangeActions(
          actions.map((a) => ({
            product_change_id: change.id,
            product_id: productId,
            action: a.action,
            details: a.details,
          })),
        )
        return change.id as string
      }

      describe("POST /vendor/products/:id (staging)", () => {
        it("returns 202 with a product_change carrying one UPDATE action per changed field", async () => {
          const productId = await createVendorProduct("Original Title")

          const res = await api.post(
            `/vendor/products/${productId}`,
            { title: "Updated Title", description: "New description" },
            sellerHeaders,
          )

          expect(res.status).toBe(202)
          expect(res.data.product_change).toBeDefined()
          expect(res.data.product_change.product_id).toBe(productId)

          const actions = res.data.product_change.actions as Array<{
            action: string
            details: { field?: string; value?: unknown }
          }>
          const fields = actions
            .filter((a) => a.action === ProductChangeActionType.UPDATE)
            .map((a) => a.details.field)
            .sort()
          expect(fields).toEqual(["description", "title"])
        })

        it("skips fields that did not change", async () => {
          const productId = await createVendorProduct("Stable Title")

          const res = await api.post(
            `/vendor/products/${productId}`,
            { title: "Stable Title", description: "Only this changed" },
            sellerHeaders,
          )

          expect(res.status).toBe(202)
          const updateActions = (res.data.product_change.actions as Array<any>).filter(
            (a) => a.action === ProductChangeActionType.UPDATE,
          )
          expect(updateActions).toHaveLength(1)
          expect(updateActions[0].details.field).toBe("description")
        })

        it("auto-confirm applies the change when PRODUCT_REQUEST flag is disabled (default test env)", async () => {
          const productId = await createVendorProduct("Before")

          await api.post(
            `/vendor/products/${productId}`,
            { title: "After" },
            sellerHeaders,
          )

          const got = await api.get(
            `/vendor/products/${productId}`,
            sellerHeaders,
          )
          expect(got.data.product.title).toBe("After")

          // The product carries two changes by the time we look: the
          // publish-approval change opened on create + the edit change
          // opened by this test. Both are auto-confirmed in the test
          // env. Assert specifically on the edit change.
          const changes = await listChanges(productId)
          const editChange = changes.find((c) =>
            c.actions.some(
              (a) =>
                a.action === ProductChangeActionType.UPDATE &&
                a.details.field === "title",
            ),
          )
          expect(editChange).toBeDefined()
          expect(editChange!.status).toBe(ProductChangeStatus.CONFIRMED)
        })

        it("rejects a second pending edit while one is already open", async () => {
          const productId = await createVendorProduct("Title")
          await seedPendingChange(productId, "seller-x", [
            {
              action: ProductChangeActionType.UPDATE,
              details: { field: "title", value: "Pending" },
            },
          ])

          const res = await api
            .post(
              `/vendor/products/${productId}`,
              { title: "Another" },
              sellerHeaders,
            )
            .catch((e) => e.response)

          expect(res.status).toBeGreaterThanOrEqual(400)
        })
      })

      describe("DELETE /vendor/products/:id (staging)", () => {
        it("stages a PRODUCT_DELETE action and returns 202", async () => {
          const productId = await createVendorProduct("Disposable")

          const res = await api.delete(
            `/vendor/products/${productId}`,
            sellerHeaders,
          )

          expect(res.status).toBe(202)
          const actions = res.data.product_change.actions as Array<{
            action: string
          }>
          expect(actions.some((a) => a.action === ProductChangeActionType.PRODUCT_DELETE)).toBe(
            true,
          )
        })

        it("auto-confirm deletes the product inline when the flag is off", async () => {
          const productId = await createVendorProduct("Vanishing")

          await api.delete(`/vendor/products/${productId}`, sellerHeaders)

          const res = await api
            .get(`/vendor/products/${productId}`, sellerHeaders)
            .catch((e) => e.response)
          expect(res.status).toBe(404)
        })
      })

      describe("POST /vendor/products/:id/cancel", () => {
        it("cancels the seller's own pending change", async () => {
          const productId = await createVendorProduct("To Cancel")
          // Seed a pending change owned by the *first* seller. The route
          // resolves the change by `(product_id, created_by, status: pending)`,
          // so the seed must carry the seller's id, not a fake one.
          const sellerId = sellerHeaders.headers["x-seller-id"]
          const changeId = await seedPendingChange(productId, sellerId, [
            {
              action: ProductChangeActionType.UPDATE,
              details: { field: "title", value: "Pending Title" },
            },
          ])

          const res = await api.post(
            `/vendor/products/${productId}/cancel`,
            {},
            sellerHeaders,
          )

          expect(res.status).toBe(200)
          expect(res.data.product_change.id).toBe(changeId)
          expect(res.data.product_change.status).toBe(ProductChangeStatus.CANCELED)
        })

        it("returns 404 when there is no pending change", async () => {
          const productId = await createVendorProduct("No Pending")

          const res = await api
            .post(`/vendor/products/${productId}/cancel`, {}, sellerHeaders)
            .catch((e) => e.response)

          expect(res.status).toBe(404)
        })
      })

      describe("GET /vendor/products/:id/preview", () => {
        it("returns the seller's own pending change or null", async () => {
          const productId = await createVendorProduct("Preview Me")

          let res = await api.get(
            `/vendor/products/${productId}/preview`,
            sellerHeaders,
          )
          expect(res.status).toBe(200)
          expect(res.data.product_change).toBeNull()

          const sellerId = sellerHeaders.headers["x-seller-id"]
          await seedPendingChange(productId, sellerId, [
            {
              action: ProductChangeActionType.UPDATE,
              details: { field: "title", value: "Preview" },
            },
          ])

          res = await api.get(
            `/vendor/products/${productId}/preview`,
            sellerHeaders,
          )
          expect(res.data.product_change?.status).toBe(ProductChangeStatus.PENDING)
        })

        it("does not leak another seller's pending change", async () => {
          const productId = await createVendorProduct("Owned", sellerHeaders)
          const otherSellerId = otherSellerHeaders.headers["x-seller-id"]
          await seedPendingChange(productId, otherSellerId, [
            {
              action: ProductChangeActionType.UPDATE,
              details: { field: "title", value: "Other Seller" },
            },
          ])

          const res = await api.get(
            `/vendor/products/${productId}/preview`,
            sellerHeaders,
          )
          expect(res.data.product_change).toBeNull()
        })
      })

      describe("POST /vendor/products/:id/variants (staging)", () => {
        it("stages a VARIANT_ADD action", async () => {
          const productId = await createVendorProduct("With Variants")

          const res = await api.post(
            `/vendor/products/${productId}/variants`,
            { title: "Variant A" },
            sellerHeaders,
          )

          expect(res.status).toBe(202)
          const actions = res.data.product_change.actions as Array<any>
          const add = actions.find(
            (a) => a.action === ProductChangeActionType.VARIANT_ADD,
          )
          expect(add).toBeDefined()
          expect(add.details.variant.title).toBe("Variant A")
        })
      })

      describe("POST /vendor/products/:id/variants/:variant_id (staging)", () => {
        // Adds a variant (auto-confirmed in the test env) and returns its
        // applied id so the update flow has a real variant to diff against.
        const addVariant = async (
          productId: string,
          payload: Record<string, unknown>,
        ): Promise<string> => {
          await api.post(
            `/vendor/products/${productId}/variants`,
            payload,
            sellerHeaders,
          )
          const got = await api.get(
            `/vendor/products/${productId}`,
            sellerHeaders,
          )
          const variant = (got.data.product.variants as Array<any>).find(
            (v) => v.title === payload.title,
          )
          return variant.id as string
        }

        it("stages a VARIANT_UPDATE carrying the variant_id and only the changed fields", async () => {
          const productId = await createVendorProduct("Variant Update Product")
          const variantId = await addVariant(productId, {
            title: "Variant A",
            sku: "OLD-SKU",
          })

          const res = await api.post(
            `/vendor/products/${productId}/variants/${variantId}`,
            // title unchanged, sku changed
            { title: "Variant A", sku: "NEW-SKU" },
            sellerHeaders,
          )

          expect(res.status).toBe(202)
          const update = (res.data.product_change.actions as Array<any>).find(
            (a) => a.action === ProductChangeActionType.VARIANT_UPDATE,
          )
          expect(update).toBeDefined()
          expect(update.details.variant_id).toBe(variantId)
          // Only the field that actually changed is staged.
          expect(Object.keys(update.details.fields)).toEqual(["sku"])
          expect(update.details.fields.sku).toBe("NEW-SKU")
          expect(update.details.previous_fields.sku).toBe("OLD-SKU")
        })

        it("never stages manage_inventory — it is not vendor-editable (MER-168)", async () => {
          const productId = await createVendorProduct("Manage Inventory Product")
          const variantId = await addVariant(productId, {
            title: "Variant B",
            sku: "SKU-B",
          })

          const res = await api.post(
            `/vendor/products/${productId}/variants/${variantId}`,
            // Client tries to flip manage_inventory alongside a real edit.
            { sku: "SKU-B2", manage_inventory: true },
            sellerHeaders,
          )

          expect(res.status).toBe(202)
          const update = (res.data.product_change.actions as Array<any>).find(
            (a) => a.action === ProductChangeActionType.VARIANT_UPDATE,
          )
          expect(update).toBeDefined()
          expect(Object.keys(update.details.fields)).toEqual(["sku"])
          expect(update.details.fields).not.toHaveProperty("manage_inventory")
        })

        it("stages no VARIANT_UPDATE action when nothing editable changed", async () => {
          const productId = await createVendorProduct("No Change Product")
          const variantId = await addVariant(productId, {
            title: "Variant C",
            sku: "SKU-C",
          })

          const res = await api.post(
            `/vendor/products/${productId}/variants/${variantId}`,
            // Same title + sku, plus a non-editable field.
            { title: "Variant C", sku: "SKU-C", manage_inventory: true },
            sellerHeaders,
          )

          expect(res.status).toBe(202)
          const updates = (res.data.product_change.actions as Array<any>).filter(
            (a) => a.action === ProductChangeActionType.VARIANT_UPDATE,
          )
          expect(updates).toHaveLength(0)
        })

        // Creates a product whose single variant sits on a variant axis, so
        // the variant carries real Medusa `options`. Returns the applied
        // variant id and its current `{ option_title: value }` map.
        const createProductWithVariantOptions = async (
          title: string,
          tag: string,
        ): Promise<{
          productId: string
          variantId: string
          currentOptions: Record<string, string>
        }> => {
          const product = (
            await api.post(
              `/vendor/products`,
              {
                status: "published",
                title,
                variant_attributes: [
                  {
                    name: `Color${tag}`,
                    type: "multi_select",
                    values: ["Red", "Blue"],
                    is_variant_axis: true,
                  },
                ],
                variants: [
                  {
                    title: "Red Variant",
                    sku: `OPT-${tag}`,
                    attribute_values: { [`Color${tag}`]: "Red" },
                  },
                ],
              },
              sellerHeaders,
            )
          ).data.product

          const variantId = product.variants[0].id as string

          const query = container.resolve(ContainerRegistrationKeys.QUERY)
          const {
            data: [loaded],
          } = await query.graph({
            entity: "variant",
            fields: ["id", "options.value", "options.option.title"],
            filters: { id: variantId },
          })

          const currentOptions = (
            (loaded.options ?? []) as Array<{
              value?: string
              option?: { title?: string }
            }>
          ).reduce<Record<string, string>>((acc, o) => {
            if (o.option?.title) acc[o.option.title] = o.value ?? ""
            return acc
          }, {})

          // Guard: the test only means something if the axis synthesized a
          // real variant option to diff against.
          expect(Object.keys(currentOptions).length).toBeGreaterThan(0)

          return { productId: product.id, variantId, currentOptions }
        }

        it("does not stage options when the variant options are unchanged (MER-168)", async () => {
          const { productId, variantId, currentOptions } =
            await createProductWithVariantOptions("Options Unchanged", "U1")

          const res = await api.post(
            `/vendor/products/${productId}/variants/${variantId}`,
            // The edit form always re-submits `options`; only the sku changed.
            { title: "Red Variant", sku: "OPT-CHANGED", options: currentOptions },
            sellerHeaders,
          )

          expect(res.status).toBe(202)
          const update = (res.data.product_change.actions as Array<any>).find(
            (a) => a.action === ProductChangeActionType.VARIANT_UPDATE,
          )
          expect(update).toBeDefined()
          expect(Object.keys(update.details.fields)).toEqual(["sku"])
          expect(update.details.fields).not.toHaveProperty("options")
        })

        it("stages options when an option value actually changed (MER-168)", async () => {
          const { productId, variantId, currentOptions } =
            await createProductWithVariantOptions("Options Changed", "C1")

          const [optionTitle] = Object.keys(currentOptions)
          const changedOptions = { ...currentOptions, [optionTitle]: "Blue" }

          const res = await api.post(
            `/vendor/products/${productId}/variants/${variantId}`,
            { title: "Red Variant", options: changedOptions },
            sellerHeaders,
          )

          expect(res.status).toBe(202)
          const update = (res.data.product_change.actions as Array<any>).find(
            (a) => a.action === ProductChangeActionType.VARIANT_UPDATE,
          )
          expect(update).toBeDefined()
          expect(update.details.fields).toHaveProperty("options")
          expect(update.details.fields.options[optionTitle]).toBe("Blue")
          // The previous map is carried for the before/after render.
          expect(update.details.previous_fields.options).toEqual(currentOptions)
        })
      })
    })
  },
})
