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
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import {
  CreateProductDTO,
  MercurModules,
  ProductChangeActionType,
} from "@mercurjs/types"

import { recordProductAuditChangeWorkflow } from "../../product-edit/workflows/record-product-audit-change"
import {
  associateSellersWithProductStep,
  materializeCreateAttributesStep,
  prepareCreateAttributesStep,
  type MaterializeCreateAttributesItem,
  type ProductAttributeRefInput,
} from "../steps"
import { ProductWorkflowEvents } from "../events"

type ProductOptionInput = { title: string; values: string[] }

/** Per-product input on the create wrapper. */
export type CreateProductWorkflowInput = Omit<
  CreateProductDTO,
  "variant_attributes" | "product_attributes" | "variants"
> & {
  /**
   * SPEC-014 unified attribute input. Axis attributes attach the product to a
   * native (mirror or inline-exclusive) product option; non-axis selections
   * are linked as values; inline (`title`) refs create product-scoped
   * attributes. Variants carry the native `options` name-map.
   */
  attributes?: ProductAttributeRefInput[]
  seller_ids?: string[]
  options?: ProductOptionInput[]
  variants?: Array<
    Record<string, unknown> & {
      options?: Record<string, string>
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
 * Marketplace wrapper over stock `createProductsWorkflow` (SPEC-014).
 *
 * Resolves the unified `attributes[]` into native product options (existing
 * mirror options referenced by id + value subset; inline axes as exclusive
 * options) and non-axis value links. Variants carry native `options` maps. A
 * default option/variant is synthesised for simple products so stock's variant
 * validator passes. After stock returns it materialises inline product-scoped
 * attributes + free-form values and writes their links + the seller links.
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

    const preparedAttrs = prepareCreateAttributesStep({
      products: input.products,
    })

    const stockProducts = transform(
      { input, preparedAttrs },
      ({ input, preparedAttrs }) =>
        input.products.map((p, idx) => {
          const {
            seller_ids: _s,
            attributes: _attrs,
            options: rawOptions,
            variants,
            ...rest
          } = p

          const prep = preparedAttrs[idx]
          const options = prep.options.length
            ? prep.options
            : (rawOptions ?? [])

          const stockVariants = (variants ?? []).map((v) => {
            const { options: vopts, ...vrest } = v
            return {
              ...vrest,
              manage_inventory: false,
              ...(vopts ? { options: vopts } : {}),
            }
          })

          // Stock requires at least one option per product — synthesise a
          // default option (+ default variant) when no axis was provided.
          if (!options.length) {
            const defaultOptionMap = {
              [DEFAULT_OPTION_TITLE]: DEFAULT_OPTION_VALUE,
            }
            return {
              ...rest,
              options: [
                { title: DEFAULT_OPTION_TITLE, values: [DEFAULT_OPTION_VALUE] },
              ],
              variants: stockVariants.length
                ? stockVariants.map((v) => ({ ...v, options: defaultOptionMap }))
                : [
                    {
                      title: "Default variant",
                      manage_inventory: false,
                      options: defaultOptionMap,
                    },
                  ],
            }
          }

          return {
            ...rest,
            options,
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

    // Read back created product options (id + value ids) so inline axis
    // attributes can mirror-link to their exclusive option.
    const { data: productsWithOptions } = useQueryGraphStep({
      entity: "product",
      fields: [
        "id",
        "options.id",
        "options.title",
        "options.values.id",
        "options.values.value",
      ],
      filters: transform({ createdProducts }, ({ createdProducts }) => ({
        id: createdProducts.map((p) => p.id),
      })),
    }).config({ name: "mercur-create-products-load-options" })

    const materializeItems = transform(
      { input, preparedAttrs, createdProducts, productsWithOptions },
      ({ input, preparedAttrs, createdProducts, productsWithOptions }) => {
        const optionsByProduct = new Map<
          string,
          MaterializeCreateAttributesItem["product_options"]
        >()
        for (const prod of productsWithOptions ?? []) {
          optionsByProduct.set(
            (prod as { id: string }).id,
            ((prod as { options?: unknown[] }).options ?? []).map((o) => {
              const opt = o as {
                id: string
                title: string
                values?: Array<{ id: string; value: string }>
              }
              return {
                id: opt.id,
                title: opt.title,
                values: (opt.values ?? []).map((v) => ({
                  id: v.id,
                  value: v.value,
                })),
              }
            }),
          )
        }

        const items: MaterializeCreateAttributesItem[] = []
        input.products.forEach((p, idx) => {
          const product_id = createdProducts[idx]?.id as string
          if (!product_id) return
          const prep = preparedAttrs[idx]
          if (!prep.inline.length && !prep.free_form.length) return
          items.push({
            product_id,
            product_options: optionsByProduct.get(product_id) ?? [],
            inline: prep.inline,
            free_form: prep.free_form,
          })
        })
        return { items }
      },
    )

    const materialized = materializeCreateAttributesStep(materializeItems)

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

    // Non-axis existing-value links (select / toggle).
    const valueLinkDefs = transform(
      { input, preparedAttrs, createdProducts },
      ({ input, preparedAttrs, createdProducts }) => {
        const defs: LinkDefinition[] = []
        input.products.forEach((p, idx) => {
          const product_id = createdProducts[idx]?.id as string
          if (!product_id) return
          for (const value_id of preparedAttrs[idx].non_axis_value_ids) {
            defs.push({
              [Modules.PRODUCT]: { product_id },
              [MercurModules.PRODUCT_ATTRIBUTE]: {
                product_attribute_value_id: value_id,
              },
            })
          }
        })
        return defs
      },
    )

    createRemoteLinkStep(valueLinkDefs).config({
      name: "mercur-create-products-value-links",
    })

    // Inline/free-form links returned by the materialization step.
    createRemoteLinkStep(
      transform({ materialized }, ({ materialized }) => materialized.links),
    ).config({ name: "mercur-create-products-materialized-links" })

    // Audit-trail ProductChange per created product (born CONFIRMED).
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
