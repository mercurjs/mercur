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

import { materializeProductAttributesWorkflow } from "./materialize-product-attributes"
import { syncProductAttributeOptionsWorkflow } from "./sync-product-attribute-options"
import {
  buildInlinePlan,
  resolveAttributeRefsStep,
} from "../../product/steps"

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
 * Adds a product attribute to a product in one shot. Composes the
 * marketplace building blocks:
 *
 *   1. `resolveAttributeRefsStep` — existing attribute lookups (by
 *      `attribute_id`) and value-name → id resolution.
 *   2. `materializeProductAttributesWorkflow` — when the caller passed
 *      inline `{ name, type, … }`, creates the product-scoped
 *      attribute + its values.
 *   3. `createRemoteLinkStep` — writes `product_attribute_value_link`
 *      rows so the product picks up the attached values on next read.
 *   4. `syncProductAttributeOptionsWorkflow` — upserts a stock product
 *      option for variant-axis attributes so the product's option set
 *      stays in sync with its variant axes.
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

    const inlinePlan = transform(
      { resolved, input },
      ({ resolved, input }) =>
        buildInlinePlan(resolved, () => input.product_id),
    )

    const materialized = materializeProductAttributesWorkflow.runAsStep({
      input: transform({ inlinePlan }, ({ inlinePlan }) => ({
        plan: inlinePlan,
      })),
    })

    const optionPlan = transform(
      { resolved, materialized },
      ({ resolved, materialized }) => {
        const r = resolved[0]
        const existing = r.existing_variant[0] ?? r.existing_product[0]
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
            value_ids: materialized.inline_values.map(
              (v) => v.id as string,
            ),
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

    syncProductAttributeOptionsWorkflow.runAsStep({
      input: transform({ input, optionPlan }, ({ input, optionPlan }) => ({
        upsert:
          optionPlan.is_variant_axis &&
          optionPlan.title &&
          optionPlan.value_names.length
            ? [
                {
                  product_id: input.product_id,
                  title: optionPlan.title,
                  values: optionPlan.value_names,
                },
              ]
            : [],
      })),
    })

    const productAttributeAdded = createHook("productAttributeAdded", {
      product_id: input.product_id,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [productAttributeAdded],
    })
  },
)
