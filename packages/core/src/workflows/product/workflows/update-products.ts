import {
  createHook,
  createWorkflow,
  type ReturnWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData, ProductTypes } from "@medusajs/framework/types"
import {
  emitEventStep,
  updateProductsWorkflow as stockUpdateProductsWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { UpdateProductDTO } from "@mercurjs/types"

import { materializeProductAttributesWorkflow } from "../../product-attribute/workflows/materialize-product-attributes"
import {
  associateSellersWithProductStep,
  buildInlinePlan,
  replaceProductAttributeValueLinksStep,
  resolveAttributeRefsStep,
  type AttributeRef,
  type AttributeValueLink,
} from "../steps"

type ProductOptionInput = { title: string; values: string[] }

export type UpdateProductWorkflowUpdate = Omit<
  UpdateProductDTO,
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
      manage_inventory?: boolean
    }
  >
}

export type UpdateProductsWorkflowInput = {
  selector: Record<string, unknown>
  update: UpdateProductWorkflowUpdate
} & AdditionalData

export const updateProductsWorkflowId = "mercur-update-products"

/**
 * Marketplace wrapper over stock `updateProductsWorkflow`. Mirrors the
 * create wrapper's translation rules. `variant_attributes` /
 * `product_attributes` are UI metadata — the wrapper REPLACES the
 * `product_attribute_value_link` set for the target products with the
 * provided values (so values un-checked in the edit form go away).
 * Inline-custom refs materialise a fresh product-scoped
 * `ProductAttribute` on each update; the UI is expected to re-send the
 * existing `attribute_id` when an inline-custom attribute round-trips
 * back through GET. Variant `manage_inventory` is pinned to `false` on
 * every variant in the payload (defensive — the marketplace invariant
 * cannot regress through a vendor patch).
 */
export const updateProductsWorkflow: ReturnWorkflow<
  UpdateProductsWorkflowInput,
  ProductTypes.ProductDTO[],
  unknown[]
> = createWorkflow(
  updateProductsWorkflowId,
  function (input: UpdateProductsWorkflowInput) {
    const resolvedGroups = resolveAttributeRefsStep({
      groups: transform({ input }, ({ input }) => [
        {
          variant_attributes: input.update.variant_attributes,
          product_attributes: input.update.product_attributes,
        },
      ]),
    })

    const refsProvided = transform({ input }, ({ input }) =>
      input.update.variant_attributes !== undefined ||
      input.update.product_attributes !== undefined,
    )

    const stockInput = transform(
      { input, resolvedGroups },
      ({ input, resolvedGroups }) => {
        const {
          seller_ids: _s,
          variant_attributes: _va,
          product_attributes: _pa,
          options: rawOptions,
          variants,
          ...update
        } = input.update

        const refs = resolvedGroups[0]
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
        const options = synthOptions.length ? synthOptions : rawOptions

        const stockVariants = variants?.map((v) => {
          const {
            manage_inventory: _mi,
            attribute_values,
            options: vopts,
            ...rest
          } = v
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
            ...rest,
            manage_inventory: false,
            ...(mapped ? { options: mapped } : {}),
          }
        })

        return {
          selector: input.selector,
          update: {
            ...update,
            ...(options?.length ? { options } : {}),
            ...(stockVariants ? { variants: stockVariants } : {}),
          },
          additional_data: input.additional_data,
        }
      },
    )

    stockUpdateProductsWorkflow.runAsStep({ input: stockInput as any })

    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id"],
      filters: input.selector,
    }).config({ name: "mercur-update-products-load" })

    const inlinePlan = transform(
      { resolvedGroups, products, refsProvided },
      ({ resolvedGroups, products, refsProvided }) => {
        if (!refsProvided) return []
        // The update wrapper only has one group; replicate the same
        // resolved refs across every selected product.
        const broadcast = products.map(() => resolvedGroups[0])
        return buildInlinePlan(
          broadcast,
          (idx) => products[idx]?.id as string | undefined,
        )
      },
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
      { input, products },
      ({ input, products }) => {
        if (input.update.seller_ids === undefined) return []
        const links: { product_id: string; seller_id: string }[] = []
        for (const product of products) {
          for (const seller_id of input.update.seller_ids ?? []) {
            links.push({ product_id: product.id as string, seller_id })
          }
        }
        return links
      },
    )

    associateSellersWithProductStep({ links: sellerProductLinks }).config({
      name: "mercur-update-products-associate-sellers",
    })

    const linkReplaceInput = transform(
      {
        resolvedGroups,
        products,
        inlinePlan,
        createdInlineValues,
        refsProvided,
      },
      ({
        resolvedGroups,
        products,
        inlinePlan,
        createdInlineValues,
        refsProvided,
      }) => {
        if (!refsProvided) {
          return { replace: false, product_ids: [], links: [] }
        }
        const refs = resolvedGroups[0]
        const links: AttributeValueLink[] = []

        // Existing-attribute refs already carry resolved value ids.
        products.forEach((p) => {
          const product_id = p.id as string
          for (const ref of refs.existing_variant)
            for (const vid of ref.value_ids)
              links.push({ product_id, product_attribute_value_id: vid })
          for (const ref of refs.existing_product)
            for (const vid of ref.value_ids)
              links.push({ product_id, product_attribute_value_id: vid })
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
          for (const v of slice) {
            links.push({
              product_id: entry.product_id,
              product_attribute_value_id: v.id as string,
            })
          }
        }

        return {
          replace: true,
          product_ids: products.map((p) => p.id as string),
          links,
        }
      },
    )

    replaceProductAttributeValueLinksStep(linkReplaceInput)

    const productsUpdated = createHook("productsUpdated", {
      products,
      additional_data: input.additional_data,
    })

    emitEventStep({
      eventName: "product.updated",
      data: transform({ products }, ({ products }) =>
        products.map((p) => ({ id: p.id })),
      ),
    })

    return new WorkflowResponse(products, {
      hooks: [productsUpdated],
    })
  },
)
