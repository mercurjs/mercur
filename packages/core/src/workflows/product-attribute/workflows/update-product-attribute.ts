import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { AttributeType, ProductAttributeDTO } from "@mercurjs/types"

import { addProductAttributeWorkflow } from "./add-product-attribute"
import { detachProductAttributeWorkflow } from "./detach-product-attribute"

export type UpdateProductAttributeWorkflowInput = {
  product_id: string
  attribute_id: string
  value_ids?: string[]
  values?: string[]
}

export type UpdateProductAttributeWorkflowOutput = {
  product_attribute: ProductAttributeDTO | null
}

type LoadedAttributeValue = {
  id: string
  name: string
  attribute?: Partial<ProductAttributeDTO> & {
    id?: string
    name?: string
    type?: AttributeType
  }
}

type LoadedProduct = {
  attribute_values?: LoadedAttributeValue[]
}

export const updateProductAttributeWorkflowId = "update-product-attribute"

/**
 * Replaces the value set of a single attribute on a product. Composes
 * `detachProductAttributeWorkflow` (drops the existing value links) +
 * `addProductAttributeWorkflow` (links the new value set) in one
 * workflow run so a failure in the add path rolls back the detach.
 * Re-reads the product's attribute values at the end and returns the
 * refreshed `product_attribute` shape, so route handlers can ship the
 * response directly without a second query + ad-hoc filtering.
 */
export const updateProductAttributeWorkflow = createWorkflow(
  updateProductAttributeWorkflowId,
  function (input: UpdateProductAttributeWorkflowInput) {
    detachProductAttributeWorkflow.runAsStep({
      input: transform({ input }, ({ input }) => ({
        product_id: input.product_id,
        attribute_id: input.attribute_id,
      })),
    })

    addProductAttributeWorkflow.runAsStep({
      input: transform({ input }, ({ input }) => ({
        product_id: input.product_id,
        attribute_id: input.attribute_id,
        value_ids: input.value_ids,
        values: input.values,
      })),
    })

    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: [
        "attribute_values.id",
        "attribute_values.name",
        "attribute_values.attribute.id",
        "attribute_values.attribute.name",
        "attribute_values.attribute.type",
        "attribute_values.attribute.handle",
        "attribute_values.attribute.description",
        "attribute_values.attribute.is_required",
        "attribute_values.attribute.is_filterable",
        "attribute_values.attribute.is_variant_axis",
        "attribute_values.attribute.rank",
        "attribute_values.attribute.is_active",
      ],
      filters: { id: input.product_id },
    }).config({ name: "update-pa-load-product" })

    const product_attribute = transform(
      { products, input },
      ({ products, input }) => {
        const product = (products as LoadedProduct[])[0]
        const matched = (product?.attribute_values ?? []).filter(
          (v) => v.attribute?.id === input.attribute_id,
        )

        if (matched.length === 0) {
          return null
        }

        const attr = matched[0].attribute ?? {}

        return {
          ...attr,
          values: matched.map((v) => ({ id: v.id, name: v.name })),
        } as ProductAttributeDTO
      },
    )

    return new WorkflowResponse(
      transform({ product_attribute }, ({ product_attribute }) => ({
        product_attribute,
      })),
    )
  },
)
