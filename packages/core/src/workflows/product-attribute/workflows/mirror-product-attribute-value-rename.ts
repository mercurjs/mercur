import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { updateProductOptionValuesStep } from "../steps"

export type MirrorProductAttributeValueRenameWorkflowInput = {
  product_attribute_value_id: string
  new_value: string
}

export const mirrorProductAttributeValueRenameWorkflowId =
  "mirror-product-attribute-value-rename"

/**
 * Propagates a `ProductAttributeValue.name` change to every linked
 * `ProductOptionValue.value` row through the
 * `product_option_value_attribute_value_link` pivot ("Mirrored options
 * for existing attributes" — SPEC-008).
 *
 * Stock Medusa exposes a workflow for option updates
 * (`updateProductOptionsWorkflow`) but not for option-value updates
 * directly. We therefore call our own `updateProductOptionValuesStep`
 * (a thin wrapper over `IProductModuleService.updateProductOptionValues`)
 * to avoid the full-`values: string[]` replacement that the parent
 * option workflow would do (which would reorder IDs and break variant
 * identity).
 *
 * **Deferred**: fingerprint refresh on the link row — same rationale
 * as `mirrorProductAttributeRenameWorkflow`. Reconciliation tooling
 * recomputes the fingerprint from the current source value on each
 * pass.
 */
export const mirrorProductAttributeValueRenameWorkflow: ReturnWorkflow<
  MirrorProductAttributeValueRenameWorkflowInput,
  void,
  []
> = createWorkflow(
  mirrorProductAttributeValueRenameWorkflowId,
  function (input: MirrorProductAttributeValueRenameWorkflowInput) {
    const { data: linkedValues } = useQueryGraphStep({
      entity: "product_option_value",
      fields: ["id", "value", "source_attribute_value.id"],
      filters: {
        source_attribute_value: { id: input.product_attribute_value_id },
      },
    }).config({ name: "pa-load-mirrored-option-values" })

    const linkedValueIds = transform(
      { linkedValues, input },
      ({ linkedValues, input }) =>
        (linkedValues ?? [])
          .filter(
            (v) =>
              (v as { source_attribute_value?: { id?: string } })
                .source_attribute_value?.id ===
              input.product_attribute_value_id,
          )
          .map((v) => (v as { id: string }).id),
    )

    when(
      { linkedValueIds },
      ({ linkedValueIds }) => linkedValueIds.length > 0,
    ).then(() => {
      updateProductOptionValuesStep(
        transform(
          { linkedValueIds, input },
          ({ linkedValueIds, input }) => ({
            ids: linkedValueIds,
            update: { value: input.new_value },
          }),
        ),
      )
    })

    return new WorkflowResponse(void 0)
  },
)
