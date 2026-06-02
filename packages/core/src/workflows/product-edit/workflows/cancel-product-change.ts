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
  cancelProductChangeStep,
  validateProductChangeIsPendingStep,
} from "../steps"

export type CancelProductChangeWorkflowInput = {
  id: string
  canceled_by?: string
} & AdditionalData

export type CancelProductChangeWorkflowHooks = [
  Hook<"validate", { input: CancelProductChangeWorkflowInput }, unknown>,
  Hook<
    "productChangeCanceled",
    {
      id: string
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const cancelProductChangeWorkflowId = "cancel-product-change"

export const cancelProductChangeWorkflow: ReturnWorkflow<
  CancelProductChangeWorkflowInput,
  void,
  CancelProductChangeWorkflowHooks
> = createWorkflow(
  cancelProductChangeWorkflowId,
  function (input: CancelProductChangeWorkflowInput) {
    const validate = createHook("validate", { input })

    const { data: changes } = useQueryGraphStep({
      entity: "product_change",
      fields: ["id", "status"],
      filters: { id: input.id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "pc-load-change" })

    const change = transform({ changes }, ({ changes }) => changes[0])

    validateProductChangeIsPendingStep({ change })

    cancelProductChangeStep({
      id: input.id,
      canceled_by: input.canceled_by,
    })

    emitEventStep({
      eventName: ProductChangeWorkflowEvents.CANCELED,
      data: { id: input.id },
    })

    const productChangeCanceled = createHook("productChangeCanceled", {
      id: input.id,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, productChangeCanceled],
    })
  },
)
