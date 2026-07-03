// Force the product-request approval queue ON for this suite. The
// shared test env (`integration-tests/.env.test`) ships
// `MEDUSA_FF_PRODUCT_REQUEST=false`; `loadEnv` (dotenv) does not
// override an already-set value, so assigning it here — before the
// test runner boots the Medusa app — flips the flag for this file only.
process.env.MEDUSA_FF_PRODUCT_REQUEST = "true"

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  ProductChangeActionType,
  ProductChangeStatus,
  ProductStatus,
} from "@mercurjs/types"

import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60_000)

/**
 * MER-181 — a vendor must be able to delete a `draft` product they
 * never submitted for review without it landing in the operator
 * approval queue. This suite runs with `MEDUSA_FF_PRODUCT_REQUEST=true`
 * (admin approval enabled) and asserts:
 *
 *  - deleting a `draft` product applies inline (product gone, change
 *    CONFIRMED), bypassing the queue, and
 *  - deleting a non-draft (`proposed`) product still stages a PENDING
 *    change for the operator (product preserved).
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor DELETE /vendor/products/:id — draft bypass (MER-181)", () => {
      let container: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        const a = await createSellerUser(container, {
          email: "draft-delete-seller@test.com",
          name: "Draft Delete Seller",
        })
        sellerHeaders = a.headers
      })

      const createVendorProduct = async (
        title: string,
        status: (typeof ProductStatus)[keyof typeof ProductStatus],
      ): Promise<string> => {
        const res = await api.post(
          `/vendor/products`,
          { title, status },
          sellerHeaders,
        )
        expect(res.data.product.status).toBe(status)
        return res.data.product.id
      }

      const findDeleteChange = async (productId: string) => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_change",
          fields: ["id", "status", "product_id", "actions.*"],
          filters: { product_id: productId },
        })
        return (
          data as Array<{
            id: string
            status: string
            actions: Array<{ action: string }>
          }>
        ).find((c) =>
          c.actions.some(
            (a) => a.action === ProductChangeActionType.PRODUCT_DELETE,
          ),
        )
      }

      it("deletes a draft product inline even when PRODUCT_REQUEST is enabled", async () => {
        const productId = await createVendorProduct(
          "Draft Disposable",
          ProductStatus.DRAFT,
        )

        const res = await api.delete(
          `/vendor/products/${productId}`,
          sellerHeaders,
        )
        expect(res.status).toBe(202)

        // The product is actually gone — the delete was applied, not queued.
        const got = await api
          .get(`/vendor/products/${productId}`, sellerHeaders)
          .catch((e) => e.response)
        expect(got.status).toBe(404)

        // The staged change was force-confirmed, not left pending.
        const deleteChange = await findDeleteChange(productId)
        expect(deleteChange).toBeDefined()
        expect(deleteChange!.status).toBe(ProductChangeStatus.CONFIRMED)
      })

      it("keeps a non-draft delete pending for admin approval when PRODUCT_REQUEST is enabled", async () => {
        const productId = await createVendorProduct(
          "Proposed Keepme",
          ProductStatus.PROPOSED,
        )

        const res = await api.delete(
          `/vendor/products/${productId}`,
          sellerHeaders,
        )
        expect(res.status).toBe(202)

        // The product survives — the delete is awaiting operator approval.
        const got = await api.get(
          `/vendor/products/${productId}`,
          sellerHeaders,
        )
        expect(got.status).toBe(200)

        const deleteChange = await findDeleteChange(productId)
        expect(deleteChange).toBeDefined()
        expect(deleteChange!.status).toBe(ProductChangeStatus.PENDING)
      })
    })
  },
})
