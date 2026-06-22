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
  declineProductChangeStep,
  validateProductChangeIsPendingStep,
} from "../steps"

export type RejectProductChangeWorkflowInput = {
  id: string
  declined_by?: string
  declined_reason?: string
} & AdditionalData

export type RejectProductChangeWorkflowHooks = [
  Hook<"validate", { input: RejectProductChangeWorkflowInput }, unknown>,
  Hook<
    "productChangeRejected",
    {
      id: string
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const rejectProductChangeWorkflowId = "reject-product-change"

export const rejectProductChangeWorkflow: ReturnWorkflow<
  RejectProductChangeWorkflowInput,
  void,
  RejectProductChangeWorkflowHooks
> = createWorkflow(
  rejectProductChangeWorkflowId,
  function (input: RejectProductChangeWorkflowInput) {
    const validate = createHook("validate", { input })

    const { data: changes } = useQueryGraphStep({
      entity: "product_change",
      fields: ["id", "status"],
      filters: { id: input.id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "pc-load-change" })

    const change = transform({ changes }, ({ changes }) => changes[0])

    validateProductChangeIsPendingStep({ change })

    declineProductChangeStep({
      id: input.id,
      declined_by: input.declined_by,
      declined_reason: input.declined_reason,
    })

    emitEventStep({
      eventName: ProductChangeWorkflowEvents.DECLINED,
      data: { id: input.id },
    })

    const productChangeRejected = createHook("productChangeRejected", {
      id: input.id,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, productChangeRejected],
    })
  },
)
