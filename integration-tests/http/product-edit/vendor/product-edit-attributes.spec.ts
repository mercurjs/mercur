import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  MercurModules,
  ProductChangeActionType,
  ProductAttributeValueSnapshot,
} from "@mercurjs/types"

import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(60_000)

/**
 * Attribute edits are staged through `productEditUpdateAttributesWorkflow`,
 * which diffs the proposed batch against the product's current selection the
 * way `productEditUpdateProductWorkflow` diffs native fields. These cover the
 * diff itself: recorded `previous_value`, dropped no-ops, and the
 * `attribute_ids` that `PRODUCT_ADD` records at creation.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor /vendor/products/:id/attributes/batch — attribute diffing", () => {
      let container: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }

      beforeAll(async () => {
        container = getContainer()
      })

      beforeEach(async () => {
        const seller = await createSellerUser(container, {
          email: "attr-seller@test.com",
          name: "Attr Seller",
        })
        sellerHeaders = seller.headers
      })

      const createGlobalAttribute = async (opts: {
        name: string
        type: "single_select" | "multi_select"
        values: string[]
      }) => {
        const service: any = container.resolve(MercurModules.PRODUCT_ATTRIBUTE)
        const [attribute] = await service.createProductAttributes([
          {
            name: opts.name,
            handle: opts.name.toLowerCase(),
            type: opts.type,
            is_variant_axis: false,
          },
        ])
        const values = await service.createProductAttributeValues(
          opts.values.map((name, rank) => ({
            name,
            rank,
            attribute_id: attribute.id,
          })),
        )
        return {
          id: attribute.id as string,
          byName: new Map<string, string>(
            values.map((v: { id: string; name: string }) => [v.name, v.id]),
          ),
        }
      }

      const actionsOf = async (
        productId: string,
        body: Record<string, unknown>,
      ) => {
        const res = await api.post(
          `/vendor/products/${productId}/attributes/batch`,
          body,
          sellerHeaders,
        )
        expect(res.status).toBe(202)
        return (res.data.product_change.actions ?? []) as Array<{
          action: string
          details: {
            attribute_id?: string | null
            value?: unknown
            previous_value?: ProductAttributeValueSnapshot | null
          }
        }>
      }

      const latestProductAdd = async (productId: string) => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_change",
          fields: ["id", "actions.action", "actions.details"],
          filters: { product_id: productId },
        })
        const actions = (
          data as Array<{
            actions: Array<{ action: string; details: Record<string, unknown> }>
          }>
        ).flatMap((change) => change.actions ?? [])
        return actions.find(
          (a) => a.action === ProductChangeActionType.PRODUCT_ADD,
        )
      }

      it("records previous_value on an attribute update", async () => {
        const material = await createGlobalAttribute({
          name: "Material",
          type: "single_select",
          values: ["Cotton", "Wool"],
        })
        const cotton = material.byName.get("Cotton")!
        const wool = material.byName.get("Wool")!

        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Diffed Product",
          attributes: [{ id: material.id, value_ids: [cotton] }],
        })

        const actions = await actionsOf(product.id, {
          update: [{ id: material.id, add: [wool], remove: [cotton] }],
        })

        const update = actions.find(
          (a) => a.action === ProductChangeActionType.ATTRIBUTE_UPDATE,
        )
        expect(update).toBeDefined()
        expect(update!.details.attribute_id).toBe(material.id)
        expect(update!.details.previous_value).toMatchObject({
          attribute_id: material.id,
          value_ids: [cotton],
        })
      })

      it("produces zero actions for a no-op attribute edit", async () => {
        const material = await createGlobalAttribute({
          name: "Material",
          type: "single_select",
          values: ["Cotton", "Wool"],
        })
        const cotton = material.byName.get("Cotton")!

        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Unchanged Product",
          attributes: [{ id: material.id, value_ids: [cotton] }],
        })

        // Re-adding the value the product already holds, and removing one it
        // does not, are both no-ops against the current selection.
        const actions = await actionsOf(product.id, {
          update: [
            { id: material.id, add: [cotton], remove: [material.byName.get("Wool")!] },
          ],
        })

        expect(actions).toHaveLength(0)
      })

      it("skips removing an attribute the product does not hold", async () => {
        const material = await createGlobalAttribute({
          name: "Material",
          type: "single_select",
          values: ["Cotton"],
        })
        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Bare Product",
        })

        const actions = await actionsOf(product.id, {
          remove: [material.id],
        })

        expect(actions).toHaveLength(0)
      })

      it("records previous_value when removing an attribute the product holds", async () => {
        const material = await createGlobalAttribute({
          name: "Material",
          type: "single_select",
          values: ["Cotton"],
        })
        const cotton = material.byName.get("Cotton")!

        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Removable Product",
          attributes: [{ id: material.id, value_ids: [cotton] }],
        })

        const actions = await actionsOf(product.id, { remove: [material.id] })

        const removal = actions.find(
          (a) => a.action === ProductChangeActionType.ATTRIBUTE_REMOVE,
        )
        expect(removal).toBeDefined()
        expect(removal!.details.previous_value).toMatchObject({
          attribute_id: material.id,
          value_ids: [cotton],
        })
      })

      it("carries attribute_id on adds of an existing attribute", async () => {
        const material = await createGlobalAttribute({
          name: "Material",
          type: "single_select",
          values: ["Cotton"],
        })
        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Adding Product",
        })

        const actions = await actionsOf(product.id, {
          add: [{ id: material.id, value_ids: [material.byName.get("Cotton")!] }],
        })

        const add = actions.find(
          (a) => a.action === ProductChangeActionType.ATTRIBUTE_ADD,
        )
        expect(add).toBeDefined()
        expect(add!.details.attribute_id).toBe(material.id)
        expect(add!.details.previous_value).toBeNull()
      })

      it("records attribute_ids on PRODUCT_ADD at creation", async () => {
        const material = await createGlobalAttribute({
          name: "Material",
          type: "single_select",
          values: ["Cotton"],
        })

        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Created With Attributes",
          attributes: [
            { id: material.id, value_ids: [material.byName.get("Cotton")!] },
          ],
        })

        const productAdd = await latestProductAdd(product.id)
        expect(productAdd).toBeDefined()
        expect(productAdd!.details.attribute_ids).toEqual([material.id])
      })

      it("records an empty attribute_ids for a product created without attributes", async () => {
        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Created Bare",
        })

        const productAdd = await latestProductAdd(product.id)
        expect(productAdd).toBeDefined()
        expect(productAdd!.details.attribute_ids).toEqual([])
      })
    })
  },
})
