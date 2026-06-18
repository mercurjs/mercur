import { AdditionalData } from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  dismissRemoteLinkStep,
  emitEventStep,
} from "@medusajs/medusa/core-flows"

import { ProductAttributeValueWorkflowEvents } from "../events"
import {
  deleteProductAttributeValuesStep,
  unmirrorDeletedAttributeValuesStep,
} from "../steps"

export type DeleteProductAttributeValuesWorkflowInput = {
  ids: string[]
} & AdditionalData

export type DeleteProductAttributeValuesWorkflowHooks = [
  Hook<
    "validate",
    { input: DeleteProductAttributeValuesWorkflowInput },
    unknown
  >,
  Hook<
    "productAttributeValuesDeleted",
    {
      ids: string[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const deleteProductAttributeValuesWorkflowId =
  "delete-product-attribute-values"

export const deleteProductAttributeValuesWorkflow: ReturnWorkflow<
  DeleteProductAttributeValuesWorkflowInput,
  void,
  DeleteProductAttributeValuesWorkflowHooks
> = createWorkflow(
  deleteProductAttributeValuesWorkflowId,
  function (input: DeleteProductAttributeValuesWorkflowInput) {
    const validate = createHook("validate", { input })

    // NOTE: mirror-link validation gap — previously enforced via
    // `validateProductAttributeValueNotMirroredStep`; dropped to avoid the
    // full-table scan it required.

    // SPEC-014 §F: delete the mirror option values first (while the links still
    // resolve) and collect explicit dismiss defs for BOTH product-module links
    // (product↔value selection + value→optionvalue mirror). A wildcard
    // `[PRODUCT]: {}` can no longer disambiguate the two.
    const prepared = unmirrorDeletedAttributeValuesStep({
      value_ids: input.ids,
    })

    dismissRemoteLinkStep(
      transform({ prepared }, ({ prepared }) => prepared.dismiss_links),
    ).config({
      name: "pa-dismiss-attribute-value-links",
    })

    deleteProductAttributeValuesStep(input.ids)

    emitEventStep({
      eventName: ProductAttributeValueWorkflowEvents.DELETED,
      data: transform({ input }, ({ input }) =>
        input.ids.map((id) => ({ id })),
      ),
    })

    const productAttributeValuesDeleted = createHook(
      "productAttributeValuesDeleted",
      {
        ids: input.ids,
        additional_data: input.additional_data,
      },
    )

    return new WorkflowResponse(void 0, {
      hooks: [validate, productAttributeValuesDeleted],
    })
  },
)
