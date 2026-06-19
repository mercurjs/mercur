import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  createProductAttributesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

/**
 * SPEC-014 §G — vendor attribute batch endpoint
 * `POST /vendor/products/:id/attributes/batch`. Direct-apply (200), same engine
 * as admin, scoped to a product the seller owns.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Vendor - product attributes batch", () => {
      let appContainer: MedusaContainer
      let seller: any
      let sellerHeaders: any

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const res = await createSellerUser(appContainer, {
          email: "vendor-attrs@test.com",
          name: "Vendor Attrs Store",
        })
        seller = res.seller
        sellerHeaders = res.headers
      })

      const createAttr = async (opts: {
        name: string
        type: "multi_select" | "single_select" | "text" | "unit" | "toggle"
        is_variant_axis?: boolean
        values?: string[]
      }) => {
        const { result } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: opts.name,
                type: opts.type,
                is_variant_axis: opts.is_variant_axis ?? false,
                values: (opts.values ?? []).map((name, rank) => ({
                  name,
                  rank,
                })),
              },
            ],
          },
        })
        const id = result[0].id
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "values.id", "values.name"],
          filters: { id },
        })
        const byName = new Map<string, string>(
          (data[0].values ?? []).map((v: { id: string; name: string }) => [
            v.name,
            v.id,
          ]),
        )
        return { id, byName }
      }

      const createOwnedProduct = async () => {
        const { result } = await createProductsWorkflow(appContainer).run({
          input: {
            products: [
              {
                title: "Vendor Product",
                status: "published",
                options: [{ title: "Default", values: ["Default"] }],
                variants: [
                  { title: "Default", options: { Default: "Default" } },
                ],
              },
            ],
            seller_ids: [seller.id],
          } as any,
        })
        return (result as { id: string }[])[0].id
      }

      const batch = (productId: string, body: Record<string, unknown>) =>
        api.post(
          `/vendor/products/${productId}/attributes/batch`,
          body,
          sellerHeaders,
        )

      const valueNames = (product: any) =>
        (product.product_attribute_values ?? [])
          .map((v: any) => v.name)
          .sort()

      // Axis attachment via the ProductOption side (product.options populate is
      // broken on the 2.16 preview build).
      const optionAttached = async (productId: string, title: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_option",
          fields: ["id", "title", "products.id"],
          filters: { title },
        })
        return (data ?? []).some(
          (o: any) =>
            o.title === title &&
            (o.products ?? []).some((p: any) => p.id === productId),
        )
      }

      it("add: axis attach + toggle, then non-axis remove (200)", async () => {
        const color = await createAttr({
          name: "Color",
          type: "multi_select",
          is_variant_axis: true,
          values: ["Red", "Blue"],
        })
        const waterproof = await createAttr({
          name: "Waterproof",
          type: "toggle",
        })
        const productId = await createOwnedProduct()

        const added = await batch(productId, {
          add: [
            { id: color.id, value_ids: [color.byName.get("Red")!] },
            { id: waterproof.id, value: true },
          ],
        })
        expect(added.status).toEqual(200)
        expect(await optionAttached(productId, "Color")).toBe(true)
        expect(valueNames(added.data.product)).toEqual(["true"])

        // toggle swap true → false (non-axis).
        const updated = await batch(productId, {
          update: [{ id: waterproof.id, value: false }],
        })
        expect(updated.status).toEqual(200)
        expect(valueNames(updated.data.product)).toEqual(["false"])

        // remove the toggle value link.
        const removed = await batch(productId, { remove: [waterproof.id] })
        expect(removed.status).toEqual(200)
        expect(valueNames(removed.data.product)).toEqual([])
      })

      it("add: inline axis → exclusive option + scoped attribute", async () => {
        const productId = await createOwnedProduct()

        const res = await batch(productId, {
          add: [{ title: "Size", values: ["S", "M"], is_variant_axis: true }],
        })

        expect(res.status).toEqual(200)
        expect(await optionAttached(productId, "Size")).toBe(true)
        const scoped = (res.data.product.scoped_attributes ?? []).find(
          (a: any) => a.name === "Size",
        )
        expect(scoped).toBeTruthy()
      })

      it("rejects batch on a product the seller does not own", async () => {
        // product owned by nobody (no seller link)
        const { result } = await createProductsWorkflow(appContainer).run({
          input: {
            products: [
              {
                title: "Foreign",
                status: "published",
                options: [{ title: "Default", values: ["Default"] }],
                variants: [
                  { title: "Default", options: { Default: "Default" } },
                ],
              },
            ],
          },
        })
        const foreignId = (result as { id: string }[])[0].id
        const attr = await createAttr({ name: "Material", type: "text" })

        const err = await batch(foreignId, {
          add: [{ id: attr.id, value: "x" }],
        }).catch((e) => e)

        expect(err.response.status).toEqual(404)
      })
    })
  },
})
