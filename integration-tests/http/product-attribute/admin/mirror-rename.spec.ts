import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

import {
  mirrorProductAttributeRenameWorkflow,
  mirrorProductAttributeValueRenameWorkflow,
  updateProductAttributesWorkflow,
  updateProductAttributeValuesWorkflow,
} from "../../../../packages/core/src/workflows/product-attribute"

jest.setTimeout(50000)

/**
 * Integration coverage for the SPEC-008 mirror-rename workflows +
 * subscribers (Session 24 cont. step 4E).
 *
 * Verifies that renames on a `ProductAttribute` / `ProductAttributeValue`
 * propagate to every linked `ProductOption.title` /
 * `ProductOptionValue.value` through the
 * `product_option_attribute_link` + `product_option_value_attribute_value_link`
 * pivots.
 *
 * **Gated on SPEC-008 step 5** — the mirror workflows resolve linked
 * options through the new `product-attribute` module's joiner, which
 * needs `withMercur()` to register the new modules. See sibling
 * `product-change.spec.ts` for the rationale.
 */
const STEP_5_LANDED = process.env.SPEC_008_STEP_5_LANDED === "true"

if (STEP_5_LANDED) {
  medusaIntegrationTestRunner({
    testSuite: ({ getContainer, dbConnection }) => {
      describe("Mirror-rename workflows (SPEC-008)", () => {
        let appContainer: MedusaContainer

        beforeAll(async () => {
          appContainer = getContainer()
        })

        beforeEach(async () => {
          await createAdminUser(dbConnection, adminHeaders, appContainer)
        })

        const seedMirroredProduct = async (
          attributeName: string,
          valueNames: string[],
        ): Promise<{
          attributeId: string
          attributeValueIds: string[]
          productId: string
          optionId: string
          optionValueIds: string[]
        }> => {
          const attributeModule = appContainer.resolve(
            MercurModules.PRODUCT_ATTRIBUTE,
          )
          const [attribute] = await attributeModule.createProductAttributes([
            {
              name: attributeName,
              handle: attributeName.toLowerCase(),
              type: "multi_select",
              is_variant_axis: true,
            },
          ])
          const attributeValues =
            await attributeModule.createProductAttributeValues(
              valueNames.map((name, rank) => ({
                attribute_id: attribute.id,
                name,
                handle: name.toLowerCase(),
                rank,
              })),
            )

          const productModule = appContainer.resolve(Modules.PRODUCT)
          const [product] = await productModule.createProducts([
            {
              title: "Mirrored Product",
              status: "draft",
              options: [
                {
                  title: attributeName,
                  values: valueNames,
                },
              ],
              variants: valueNames.map((v) => ({
                title: v,
                manage_inventory: false,
                options: { [attributeName]: v },
              })),
            },
          ])
          const optionId = product.options[0].id
          const optionValueIds = product.options[0].values.map(
            (ov: { id: string }) => ov.id,
          )

          // Write the mirror links by hand (no live mirror workflow yet —
          // that's the upcoming submitSellerProductsWorkflow rewrite).
          const remoteLink = appContainer.resolve("remoteLink")
          await remoteLink.create([
            {
              [Modules.PRODUCT]: { product_option_id: optionId },
              [MercurModules.PRODUCT_ATTRIBUTE]: {
                product_attribute_id: attribute.id,
              },
              data: { fingerprint: "test-fingerprint-attr" },
            },
            ...attributeValues.map((av, idx) => ({
              [Modules.PRODUCT]: { product_option_value_id: optionValueIds[idx] },
              [MercurModules.PRODUCT_ATTRIBUTE]: {
                product_attribute_value_id: av.id,
              },
              data: { fingerprint: `test-fingerprint-val-${idx}` },
            })),
          ])

          return {
            attributeId: attribute.id,
            attributeValueIds: attributeValues.map((av) => av.id),
            productId: product.id,
            optionId,
            optionValueIds,
          }
        }

        it("renames mirrored ProductOption.title when source attribute is renamed", async () => {
          const { attributeId, optionId } = await seedMirroredProduct(
            "Material",
            ["Cotton", "Linen"],
          )

          await mirrorProductAttributeRenameWorkflow(appContainer).run({
            input: {
              product_attribute_id: attributeId,
              new_name: "Fabric",
            },
          })

          const productModule = appContainer.resolve(Modules.PRODUCT)
          const option = await productModule.retrieveProductOption(optionId)
          expect(option.title).toBe("Fabric")
        })

        it("renames every mirrored ProductOptionValue.value when source value is renamed", async () => {
          const { attributeValueIds, optionValueIds } =
            await seedMirroredProduct("Color", ["Red", "Blue"])

          await mirrorProductAttributeValueRenameWorkflow(appContainer).run({
            input: {
              product_attribute_value_id: attributeValueIds[0],
              new_value: "Crimson",
            },
          })

          const productModule = appContainer.resolve(Modules.PRODUCT)
          const values = await productModule.listProductOptionValues({
            id: optionValueIds,
          })
          const renamed = values.find(
            (v: { id: string }) => v.id === optionValueIds[0],
          )
          expect(renamed.value).toBe("Crimson")
        })

        it("is a no-op when no options are mirrored to the attribute", async () => {
          const attributeModule = appContainer.resolve(
            MercurModules.PRODUCT_ATTRIBUTE,
          )
          const [attribute] = await attributeModule.createProductAttributes([
            {
              name: "Unlinked Attribute",
              handle: "unlinked",
              type: "text",
            },
          ])

          await expect(
            mirrorProductAttributeRenameWorkflow(appContainer).run({
              input: {
                product_attribute_id: attribute.id,
                new_name: "Still Unlinked",
              },
            }),
          ).resolves.not.toThrow()
        })

        it("re-running with the same new_name is idempotent", async () => {
          const { attributeId, optionId } = await seedMirroredProduct(
            "Material",
            ["Cotton"],
          )

          await mirrorProductAttributeRenameWorkflow(appContainer).run({
            input: { product_attribute_id: attributeId, new_name: "Fabric" },
          })
          await mirrorProductAttributeRenameWorkflow(appContainer).run({
            input: { product_attribute_id: attributeId, new_name: "Fabric" },
          })

          const productModule = appContainer.resolve(Modules.PRODUCT)
          const option = await productModule.retrieveProductOption(optionId)
          expect(option.title).toBe("Fabric")
        })

        it("subscriber path: updateProductAttributesWorkflow emits product-attribute.updated → mirror runs", async () => {
          const { attributeId, optionId } = await seedMirroredProduct(
            "Material",
            ["Cotton"],
          )

          await updateProductAttributesWorkflow(appContainer).run({
            input: {
              selector: { id: attributeId },
              update: { name: "Fabric (via subscriber)" },
            },
          })

          // Subscribers are async; poll briefly for the propagation.
          const productModule = appContainer.resolve(Modules.PRODUCT)
          let title = ""
          for (let i = 0; i < 10; i++) {
            const option = await productModule.retrieveProductOption(optionId)
            title = option.title
            if (title === "Fabric (via subscriber)") break
            await new Promise((r) => setTimeout(r, 200))
          }
          expect(title).toBe("Fabric (via subscriber)")
        })

        it("subscriber path: updateProductAttributeValuesWorkflow → value-rename mirror runs", async () => {
          const { attributeValueIds, optionValueIds } =
            await seedMirroredProduct("Color", ["Red"])

          await updateProductAttributeValuesWorkflow(appContainer).run({
            input: {
              selector: { id: attributeValueIds[0] },
              update: { name: "Crimson (via subscriber)" },
            },
          })

          const productModule = appContainer.resolve(Modules.PRODUCT)
          let value = ""
          for (let i = 0; i < 10; i++) {
            const [v] = await productModule.listProductOptionValues({
              id: optionValueIds[0],
            })
            value = v.value
            if (value === "Crimson (via subscriber)") break
            await new Promise((r) => setTimeout(r, 200))
          }
          expect(value).toBe("Crimson (via subscriber)")
        })
      })
    },
  })
} else {
  describe.skip(
    "Mirror-rename workflows (SPEC-008 step 5 gated)",
    () => {
      it.skip(
        "enable with SPEC_008_STEP_5_LANDED=true once withMercur() registers the new modules",
        () => {},
      )
    },
  )
}
