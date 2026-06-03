import {
  createHook,
  createWorkflow,
  type ReturnWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  AdditionalData,
  LinkDefinition,
  ProductTypes,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  createProductsWorkflow as stockCreateProductsWorkflow,
  createRemoteLinkStep,
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import {
  CreateProductDTO,
  MercurModules,
  ProductChangeActionType,
} from "@mercurjs/types"

import { materializeProductAttributesWorkflow } from "../../product-attribute/workflows/materialize-product-attributes"
import { recordProductAuditChangeWorkflow } from "../../product-edit/workflows/record-product-audit-change"
import {
  associateSellersWithProductStep,
  buildInlinePlan,
  resolveAttributeRefsStep,
  type AttributeRef,
} from "../steps"
import { ProductWorkflowEvents } from "../events"

type ProductOptionInput = { title: string; values: string[] }

/** Per-product input on the create wrapper. */
export type CreateProductWorkflowInput = Omit<
  CreateProductDTO,
  "variant_attributes" | "product_attributes" | "variants"
> & {
  variant_attributes?: AttributeRef[]
  product_attributes?: AttributeRef[]
  seller_ids?: string[]
  options?: ProductOptionInput[]
  variants?: Array<
    Record<string, unknown> & {
      options?: Record<string, string>
      attribute_values?: Record<string, string | string[]> | string[]
    }
  >
}

export type CreateProductsWorkflowInput = {
  products: CreateProductWorkflowInput[]
  /**
   * Marketplace add-on: seller ids to authorize for **every** created
   * product. For per-product seller authorization, set `seller_ids` on
   * the individual product entry instead.
   */
  seller_ids?: string[]
} & AdditionalData

export const createProductsWorkflowId = "mercur-create-products"

const DEFAULT_OPTION_TITLE = "Default option"
const DEFAULT_OPTION_VALUE = "Default option value"

/**
 * Marketplace wrapper over stock `createProductsWorkflow`.
 *
 * On top of stock it:
 *   1. Resolves `variant_attributes` / `product_attributes` (existing
 *      attribute lookups, value name ↔ id resolution) via
 *      `resolveAttributeRefsStep`.
 *   2. Synthesizes stock `options[]` from variant-axis attributes (both
 *      existing and inline) — UI doesn't have to emit a parallel
 *      `options` field.
 *   3. Renames `variants[].attribute_values` (the Mercur extension —
 *      `{Size: "S"}` name map) to `variants[].options` so stock variant
 *      generation works unchanged.
 *   4. Strips marketplace-only fields before delegating to stock.
 *   5. Pins every variant's `manage_inventory` to `false` (marketplace
 *      invariant — vendor variants never participate in inventory
 *      bookkeeping).
 *   6. Synthesizes a default option + variant for simple products so
 *      stock's variant validator does not throw.
 *   7. After stock returns, materialises inline-custom attributes via
 *      `createProductAttributesStep` + their values via
 *      `createProductAttributeValuesStep` (both scoped to the created
 *      product through the `product_id` FK).
 *   8. Writes `product_attribute_value_link` rows for every chosen
 *      value (existing + inline) using stock `createRemoteLinkStep`,
 *      so the edit form can pre-select them.
 *   9. Writes `product_seller` link rows for the requested seller_ids.
 */
export const createProductsWorkflow: ReturnWorkflow<
  CreateProductsWorkflowInput,
  ProductTypes.ProductDTO[],
  unknown[]
> = createWorkflow(
  createProductsWorkflowId,
  function (input: CreateProductsWorkflowInput) {
    const validate = createHook("validate", {
      input,
      products: input.products,
    })

    const resolved = resolveAttributeRefsStep({ groups: input.products })

    const stockProducts = transform(
      { input, resolved },
      ({ input, resolved }) =>
        input.products.map((p, idx) => {
          const {
            seller_ids: _s,
            variant_attributes: _va,
            product_attributes: _pa,
            options: rawOptions,
            variants,
            ...rest
          } = p

          // Build synthetic options from variant-axis attribute refs.
          const refs = resolved[idx]
          const synthOptions: ProductOptionInput[] = [
            ...refs.existing_variant.map((r) => ({
              title: r.attribute_name,
              values: r.value_names,
            })),
            ...refs.inline_variant.map((r) => ({
              title: r.name,
              values: r.values,
            })),
          ]
          const options = synthOptions.length ? synthOptions : (rawOptions ?? [])

          // Rename variants[].attribute_values → variants[].options if it
          // came in as a name-map. Array-of-ids form is left alone (stock
          // ignores it; the variant-attribute link layer is not in scope).
          const stockVariants = (variants ?? []).map((v) => {
            const { attribute_values, options: vopts, ...vrest } = v
            const mapped =
              vopts ??
              (attribute_values && !Array.isArray(attribute_values)
                ? Object.fromEntries(
                    Object.entries(attribute_values).map(([k, val]) => [
                      k,
                      Array.isArray(val) ? val[0] : val,
                    ]),
                  )
                : undefined)
            return {
              ...vrest,
              manage_inventory: false,
              ...(mapped ? { options: mapped } : {}),
            }
          })

          if (!options.length && !stockVariants.length) {
            return {
              ...rest,
              options: [
                { title: DEFAULT_OPTION_TITLE, values: [DEFAULT_OPTION_VALUE] },
              ],
              variants: [
                {
                  title: "Default variant",
                  manage_inventory: false,
                  options: {
                    [DEFAULT_OPTION_TITLE]: DEFAULT_OPTION_VALUE,
                  },
                },
              ],
            }
          }

          return {
            ...rest,
            ...(options.length ? { options } : {}),
            ...(stockVariants.length ? { variants: stockVariants } : {}),
          }
        }),
    )

    const createdProducts = stockCreateProductsWorkflow.runAsStep({
      input: {
        products: stockProducts as any,
        additional_data: input.additional_data,
      },
    })

    const inlinePlan = transform(
      { resolved, createdProducts },
      ({ resolved, createdProducts }) =>
        buildInlinePlan(resolved, (idx) => createdProducts[idx]?.id as string | undefined),
    )

    const materialized = materializeProductAttributesWorkflow.runAsStep({
      input: transform({ inlinePlan }, ({ inlinePlan }) => ({
        plan: inlinePlan,
      })),
    })

    const createdInlineValues = transform(
      { materialized },
      ({ materialized }) => materialized.inline_values,
    )

    const sellerProductLinks = transform(
      { input, createdProducts },
      ({ input, createdProducts }) => {
        const links: { product_id: string; seller_id: string }[] = []
        input.products.forEach((p, idx) => {
          const product_id = createdProducts[idx]?.id
          if (!product_id) return
          const sellerIds = p.seller_ids ?? input.seller_ids ?? []
          for (const seller_id of sellerIds) {
            links.push({ product_id, seller_id })
          }
        })
        return links
      },
    )

    associateSellersWithProductStep({ links: sellerProductLinks }).config({
      name: "mercur-create-products-associate-sellers",
    })

    const attributeValueLinkDefs = transform(
      { createdProducts, resolved, inlinePlan, createdInlineValues },
      ({ createdProducts, resolved, inlinePlan, createdInlineValues }) => {
        const defs: LinkDefinition[] = []

        const pushLink = (
          product_id: string,
          product_attribute_value_id: string,
        ) => {
          defs.push({
            [Modules.PRODUCT]: { product_id },
            [MercurModules.PRODUCT_ATTRIBUTE]: {
              product_attribute_value_id,
            },
          })
        }

        // Existing-attribute refs already carry resolved value ids.
        createdProducts.forEach((p, idx) => {
          const product_id = p.id as string
          if (!product_id) return
          const r = resolved[idx]
          for (const ref of r.existing_variant)
            for (const vid of ref.value_ids) pushLink(product_id, vid)
          for (const ref of r.existing_product)
            for (const vid of ref.value_ids) pushLink(product_id, vid)
        })

        // Inline values come back as a flat array; slice by the plan's
        // declared value counts to pair them with the right product.
        let valueCursor = 0
        for (const entry of inlinePlan) {
          const count = entry._value_names.length
          const slice = createdInlineValues.slice(
            valueCursor,
            valueCursor + count,
          )
          valueCursor += count
          for (const v of slice) pushLink(entry.product_id, v.id as string)
        }

        return defs
      },
    )

    createRemoteLinkStep(attributeValueLinkDefs).config({
      name: "mercur-create-products-attribute-value-links",
    })

    // Audit-trail ProductChange per created product. The change is
    // born CONFIRMED via `recordProductAuditChangeWorkflow` —
    // creation never lands in the approval queue (admin
    // publish/reject/request-changes flows open their own audit
    // changes). A `STATUS_CHANGE` action records the initial status
    // so the history is self-describing.
    recordProductAuditChangeWorkflow.runAsStep({
      input: transform(
        { createdProducts, input },
        ({ createdProducts, input }) => ({
          actor_id: input.seller_ids?.[0],
          changes: createdProducts.map((product) => ({
            product_id: product.id as string,
            actions: [
              {
                product_id: product.id as string,
                action: ProductChangeActionType.STATUS_CHANGE,
                details: { status: product.status as string },
              },
            ],
          })),
        }),
      ),
    })

    const productsCreated = createHook("productsCreated", {
      products: createdProducts,
      additional_data: input.additional_data,
    })

    emitEventStep({
      eventName: ProductWorkflowEvents.CREATED,
      data: transform({ createdProducts }, ({ createdProducts }) =>
        createdProducts.map((p) => ({ id: p.id })),
      ),
    })

    return new WorkflowResponse(createdProducts, {
      hooks: [validate, productsCreated] as const,
    })
  },
)
