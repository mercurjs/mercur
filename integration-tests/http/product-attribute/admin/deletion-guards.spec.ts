import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  applyProductAttributeChangeActionsWorkflow,
  createProductAttributesWorkflow,
  createProductsWorkflow,
  deleteProductAttributesWorkflow,
  removeProductAttributesFromProductWorkflow,
} from "@mercurjs/core/workflows"

jest.setTimeout(60000)

/**
 * Guards added on top of SPEC-014:
 *  - deleteProductAttributesWorkflow refuses to delete an attribute whose
 *    values are selected on any product (in-use guard).
 *  - removeProductAttributesFromProductWorkflow refuses to detach a required
 *    attribute from a product.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("product-attribute deletion/removal guards", () => {
      let appContainer: MedusaContainer

      beforeAll(() => {
        appContainer = getContainer()
      })

      const createAttr = async (opts: {
        name: string
        type?: "multi_select" | "single_select"
        is_required?: boolean
        values: string[]
      }) => {
        const { result } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: opts.name,
                type: opts.type ?? "single_select",
                is_required: opts.is_required ?? false,
                values: opts.values.map((name, rank) => ({ name, rank })),
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

      const createProduct = async (title: string) => {
        const { result } = await createProductsWorkflow(appContainer).run({
          input: { products: [{ title, status: "published" }] },
        })
        return (result as { id: string }[])[0].id
      }

      const expectRejects = async (
        promise: Promise<unknown>,
        pattern: RegExp,
      ) => {
        let message: string | undefined
        try {
          await promise
        } catch (e) {
          message = (e as Error).message
        }
        expect(message).toBeDefined()
        expect(message).toMatch(pattern)
      }

      const attributeExists = async (id: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id"],
          filters: { id },
        })
        return (data ?? []).length > 0
      }

      it("blocks deleting an attribute whose value is selected on a product", async () => {
        const material = await createAttr({
          name: "Guard Material",
          values: ["Cotton", "Wool"],
        })
        const productId = await createProduct("Guard Delete Product")

        await applyProductAttributeChangeActionsWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [
              { id: material.id, value_ids: [material.byName.get("Cotton")!] },
            ],
            remove: [],
            update: [],
          },
        })

        await expectRejects(
          deleteProductAttributesWorkflow(appContainer).run({
            input: { ids: [material.id] },
          }),
          /in use/i,
        )

        expect(await attributeExists(material.id)).toBe(true)
      })

      it("allows deleting an attribute not linked to any product", async () => {
        const unused = await createAttr({
          name: "Guard Unused",
          values: ["A", "B"],
        })

        await deleteProductAttributesWorkflow(appContainer).run({
          input: { ids: [unused.id] },
        })

        expect(await attributeExists(unused.id)).toBe(false)
      })

      it("blocks removing a required attribute from a product", async () => {
        const required = await createAttr({
          name: "Guard Required",
          is_required: true,
          values: ["X", "Y"],
        })
        const productId = await createProduct("Guard Required Product")

        await applyProductAttributeChangeActionsWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [{ id: required.id, value_ids: [required.byName.get("X")!] }],
            remove: [],
            update: [],
          },
        })

        await expectRejects(
          removeProductAttributesFromProductWorkflow(appContainer).run({
            input: { product_id: productId, remove: [required.id] },
          }),
          /required/i,
        )
      })

      it("allows removing a non-required attribute from a product", async () => {
        const optional = await createAttr({
          name: "Guard Optional",
          values: ["M", "N"],
        })
        const productId = await createProduct("Guard Optional Product")

        await applyProductAttributeChangeActionsWorkflow(appContainer).run({
          input: {
            product_id: productId,
            add: [{ id: optional.id, value_ids: [optional.byName.get("M")!] }],
            remove: [],
            update: [],
          },
        })

        await removeProductAttributesFromProductWorkflow(appContainer).run({
          input: { product_id: productId, remove: [optional.id] },
        })

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product",
          fields: ["id", "product_attribute_values.name"],
          filters: { id: productId },
        })
        const names = ((data[0].product_attribute_values ?? []) as {
          name: string
        }[]).map((v) => v.name)
        expect(names).not.toContain("M")
      })
    })
  },
})
