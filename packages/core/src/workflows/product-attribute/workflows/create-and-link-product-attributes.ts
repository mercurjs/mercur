import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
} from "@medusajs/medusa/core-flows"

import {
  applyProductAttributesBatchStep,
  type BatchAddRef,
  type BatchUpdateRef,
} from "../steps"

/**
 * SPEC-014 §G — the single apply engine for attribute edits on an EXISTING
 * product. Powers the `.../attributes/batch` endpoints (admin direct; vendor
 * staged through the approval queue) and replaces the legacy add/detach/batch
 * attribute workflows.
 *
 * Order is remove → add → update (handled inside the apply step); value-link
 * dismissals run before creations here so an attribute removed and re-added in
 * the same call ends up linked.
 */
export type CreateAndLinkProductAttributesWorkflowInput = {
  product_id: string
  add?: BatchAddRef[]
  remove?: string[]
  update?: BatchUpdateRef[]
}

export type CreateAndLinkProductAttributesWorkflowHooks = [
  Hook<
    "validate",
    { input: CreateAndLinkProductAttributesWorkflowInput },
    unknown
  >,
  Hook<"productAttributesLinked", { product_id: string }, unknown>,
]

export const createAndLinkProductAttributesToProductWorkflowId =
  "create-and-link-product-attributes-to-product"

export const createAndLinkProductAttributesToProductWorkflow: ReturnWorkflow<
  CreateAndLinkProductAttributesWorkflowInput,
  void,
  CreateAndLinkProductAttributesWorkflowHooks
> = createWorkflow(
  createAndLinkProductAttributesToProductWorkflowId,
  function (input: CreateAndLinkProductAttributesWorkflowInput) {
    const validate = createHook("validate", { input })

    const applied = applyProductAttributesBatchStep(input)

    dismissRemoteLinkStep(
      transform({ applied }, ({ applied }) => applied.dismiss_value_links),
    ).config({ name: "pa-batch-dismiss-value-links" })

    createRemoteLinkStep(
      transform({ applied }, ({ applied }) => applied.create_value_links),
    ).config({ name: "pa-batch-create-value-links" })

    const productAttributesLinked = createHook("productAttributesLinked", {
      product_id: input.product_id,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, productAttributesLinked],
    })
  },
)
