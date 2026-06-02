import { AdditionalData } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { AttributeType, MercurModules } from "@mercurjs/types"

import {
  createProductAttributesStep,
  createProductAttributeValuesStep,
  upsertProductOptionsForAxisStep,
} from "../steps"
import { resolveAttributeRefsStep } from "../../product/steps"

/**
 * Input accepted by {@link addProductAttributeWorkflow}. Mirrors the
 * `POST /vendor/products/:id/attributes` (and admin equivalent) body —
 * the union of the **attach-existing** and **inline-create** branches.
 */
export type AddProductAttributeWorkflowInput = {
  product_id: string
  attribute_id?: string
  value_ids?: string[]
  name?: string
  type?: AttributeType
  values?: string[]
  is_variant_axis?: boolean
  is_filterable?: boolean
  is_required?: boolean
  description?: string | null
  metadata?: Record<string, unknown> | null
} & AdditionalData

export const addProductAttributeWorkflowId = "add-product-attribute"

/**
 * Adds a product attribute to a product in one shot. Replaces the two
 * route-local inline workflows (`attach-…` + `create-scoped-…`) with a
 * single Medusa-style flow that:
 *
 *   1. Resolves the input ref via `resolveAttributeRefsStep` — existing
 *      attribute lookups (by `attribute_id`) and value-name → id
 *      resolution both run in one place.
 *   2. Materialises an inline-custom attribute + its values when the
 *      caller passed `{ name, type, … }` instead of `{ attribute_id }`.
 *   3. Writes `product_attribute_value_link` rows for every resulting
 *      value via `createRemoteLinkStep`, so the product picks up the
 *      attached values on the next read.
 *   4. Upserts a stock product option for variant-axis attributes
 *      (`is_variant_axis: true`), keeping the product's option set in
 *      sync with its variant axes.
 */
export const addProductAttributeWorkflow = createWorkflow(
  addProductAttributeWorkflowId,
  function (input: AddProductAttributeWorkflowInput) {
    const groups = transform({ input }, ({ input }) => {
      const ref =
        input.attribute_id !== undefined
          ? {
              attribute_id: input.attribute_id,
              value_ids: input.value_ids,
              values: input.values,
            }
          : {
              name: input.name as string,
              type: input.type as AttributeType,
              values: input.values,
              is_variant_axis: input.is_variant_axis,
              is_filterable: input.is_filterable,
              is_required: input.is_required,
              description: input.description,
              metadata: input.metadata,
            }
      const isVariantAxis =
        input.is_variant_axis === true ||
        (input.attribute_id !== undefined && input.is_variant_axis !== false)
      return [
        {
          variant_attributes: isVariantAxis ? [ref] : undefined,
          product_attributes: isVariantAxis ? undefined : [ref],
        },
      ]
    })

    const resolved = resolveAttributeRefsStep({ groups })

    const inlineAttrInput = transform(
      { input, resolved },
      ({ input, resolved }) => {
        const r = resolved[0]
        const inline = r.inline_variant[0] ?? r.inline_product[0]
        if (!inline) return []
        return [
          {
            product_id: input.product_id,
            name: inline.name,
            type: inline.type,
            is_variant_axis: inline.is_variant_axis,
            is_filterable: inline.is_filterable ?? false,
            is_required: inline.is_required ?? false,
            description: inline.description ?? null,
            metadata: inline.metadata ?? null,
          },
        ]
      },
    )

    const createdInlineAttrs = createProductAttributesStep(inlineAttrInput)

    const inlineValuesInput = transform(
      { resolved, createdInlineAttrs },
      ({ resolved, createdInlineAttrs }) => {
        const r = resolved[0]
        const inline = r.inline_variant[0] ?? r.inline_product[0]
        const attribute_id = createdInlineAttrs[0]?.id as string | undefined
        if (!inline || !attribute_id) return []
        return inline.values.map((name) => ({ name, attribute_id }))
      },
    )

    const createdInlineValues = createProductAttributeValuesStep(
      inlineValuesInput,
    )

    const optionPlan = transform(
      { resolved, createdInlineValues },
      ({ resolved, createdInlineValues }) => {
        const r = resolved[0]
        const existing =
          r.existing_variant[0] ?? r.existing_product[0]
        const inline = r.inline_variant[0] ?? r.inline_product[0]

        if (existing) {
          return {
            value_ids: existing.value_ids,
            title: existing.attribute_name,
            value_names: existing.value_names,
            is_variant_axis: existing.is_variant_axis,
          }
        }
        if (inline) {
          return {
            value_ids: createdInlineValues.map((v) => v.id as string),
            title: inline.name,
            value_names: inline.values,
            is_variant_axis: inline.is_variant_axis,
          }
        }
        return {
          value_ids: [] as string[],
          title: "",
          value_names: [] as string[],
          is_variant_axis: false,
        }
      },
    )

    const valueLinks = transform(
      { input, optionPlan },
      ({ input, optionPlan }) =>
        optionPlan.value_ids.map((value_id) => ({
          [Modules.PRODUCT]: { product_id: input.product_id },
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: value_id,
          },
        })),
    )

    createRemoteLinkStep(valueLinks).config({
      name: "add-product-attribute-link-values",
    })

    const optionInput = transform(
      { input, optionPlan },
      ({ input, optionPlan }) =>
        optionPlan.is_variant_axis && optionPlan.title && optionPlan.value_names.length
          ? [
              {
                product_id: input.product_id,
                title: optionPlan.title,
                values: optionPlan.value_names,
              },
            ]
          : [],
    )

    upsertProductOptionsForAxisStep(optionInput)

    const productAttributeAdded = createHook("productAttributeAdded", {
      product_id: input.product_id,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [productAttributeAdded],
    })
  },
)
