import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  ProductAttributeDTO,
  ProductAttributeValueDTO,
} from "@mercurjs/types"

import {
  createProductAttributesStep,
  createProductAttributeValuesStep,
} from "../steps"
import type { InlinePlanEntry } from "../../product/steps"

export type MaterializeProductAttributesWorkflowInput = {
  /**
   * Inline-create plan. One entry per attribute to materialize, each
   * carrying its target `product_id` (for product-scoped attributes)
   * and the deduped value names to create alongside. Build the plan
   * with `buildInlinePlan` from `../../product/steps` for the multi-
   * group case, or assemble it inline for single-product flows.
   */
  plan: InlinePlanEntry[]
  /**
   * Optional batch of value names to create against existing
   * attributes — used by the vendor edit-attributes flow to
   * materialize free-form value names submitted against unit/text/
   * toggle attributes.
   */
  free_form_values?: Array<{ name: string; attribute_id: string }>
}

export type MaterializeProductAttributesWorkflowOutput = {
  inline_attributes: ProductAttributeDTO[]
  inline_values: ProductAttributeValueDTO[]
  free_form_values: ProductAttributeValueDTO[]
}

export const materializeProductAttributesWorkflowId =
  "materialize-product-attributes"

/**
 * Materializes inline-custom product attributes + their values + any
 * free-form value names against existing attributes. Encapsulates the
 * `createProductAttributesStep` → `createProductAttributeValuesStep`
 * pairing duplicated across `createProductsWorkflow`,
 * `updateProductsWorkflow`, `addProductAttributeWorkflow`,
 * `productEditUpdateAttributesWorkflow`, and the ATTRIBUTE_ADD bucket
 * of `applyProductChangeActionsWorkflow`. Order is fixed: attributes
 * first, then inline values, then free-form values — all in one
 * workflow transaction so a failed value insert rolls back the
 * attribute insert.
 */
export const materializeProductAttributesWorkflow = createWorkflow(
  materializeProductAttributesWorkflowId,
  function (input: MaterializeProductAttributesWorkflowInput) {
    const attrInput = transform({ input }, ({ input }) =>
      (input.plan ?? []).map(
        ({ _group_idx, _value_names, ...attr }) => attr,
      ),
    )

    const inline_attributes = createProductAttributesStep(attrInput)

    const inlineValuesInput = transform(
      { input, inline_attributes },
      ({ input, inline_attributes }) => {
        const out: Array<{ name: string; attribute_id: string }> = []
        ;(input.plan ?? []).forEach((entry, i) => {
          const attribute_id = inline_attributes[i]?.id as string | undefined
          if (!attribute_id) return
          for (const name of entry._value_names) {
            out.push({ name, attribute_id })
          }
        })
        return out
      },
    )

    const inline_values = createProductAttributeValuesStep(inlineValuesInput)

    const freeFormInput = transform({ input }, ({ input }) =>
      input.free_form_values ?? [],
    )

    const free_form_values = createProductAttributeValuesStep(
      freeFormInput,
    ).config({ name: "materialize-product-attributes-free-form-values" })

    return new WorkflowResponse(
      transform(
        { inline_attributes, inline_values, free_form_values },
        ({
          inline_attributes,
          inline_values,
          free_form_values,
        }) => ({
          inline_attributes,
          inline_values,
          free_form_values,
        }),
      ),
    )
  },
)
