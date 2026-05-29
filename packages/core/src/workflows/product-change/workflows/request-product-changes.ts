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
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

import { ProductChangeWorkflowEvents } from "../events"
import {
  requestProductChangesStep,
  validateProductChangeIsPendingStep,
} from "../steps"

export type RequestProductChangesWorkflowInput = {
  id: string
  requires_action_by?: string
  requires_action_reason?: string
  external_note?: string
} & AdditionalData

export type RequestProductChangesWorkflowHooks = [
  Hook<"validate", { input: RequestProductChangesWorkflowInput }, unknown>,
  Hook<
    "productChangeRequiresAction",
    {
      id: string
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const requestProductChangesWorkflowId = "request-product-changes"

/**
 * Transitions a pending change to `REQUIRES_ACTION`. This is the workflow
 * that flips the computed `Product.requires_action` boolean to `true`
 * (resolved at read time by scanning linked changes).
 */
export const requestProductChangesWorkflow: ReturnWorkflow<
  RequestProductChangesWorkflowInput,
  void,
  RequestProductChangesWorkflowHooks
> = createWorkflow(
  requestProductChangesWorkflowId,
  function (input: RequestProductChangesWorkflowInput) {
    const validate = createHook("validate", { input })

    const { data: changes } = useQueryGraphStep({
      entity: "product_change",
      fields: ["id", "status"],
      filters: { id: input.id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "pc-load-change" })

    const change = transform({ changes }, ({ changes }) => changes[0])

    validateProductChangeIsPendingStep({ change })

    requestProductChangesStep({
      id: input.id,
      requires_action_by: input.requires_action_by,
      requires_action_reason: input.requires_action_reason,
      external_note: input.external_note,
    })

    emitEventStep({
      eventName: ProductChangeWorkflowEvents.REQUIRES_ACTION,
      data: { id: input.id },
    })

    const productChangeRequiresAction = createHook(
      "productChangeRequiresAction",
      {
        id: input.id,
        additional_data: input.additional_data,
      },
    )

    return new WorkflowResponse(void 0, {
      hooks: [validate, productChangeRequiresAction],
    })
  },
)
