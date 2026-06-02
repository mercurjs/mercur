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
  resubmitProductChangeStep,
  validateProductChangeIsRequiresActionStep,
} from "../steps"

export type ResubmitProductChangeWorkflowInput = {
  id: string
} & AdditionalData

export type ResubmitProductChangeWorkflowHooks = [
  Hook<"validate", { input: ResubmitProductChangeWorkflowInput }, unknown>,
  Hook<
    "productChangeResubmitted",
    {
      id: string
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const resubmitProductChangeWorkflowId = "resubmit-product-change"

export const resubmitProductChangeWorkflow: ReturnWorkflow<
  ResubmitProductChangeWorkflowInput,
  void,
  ResubmitProductChangeWorkflowHooks
> = createWorkflow(
  resubmitProductChangeWorkflowId,
  function (input: ResubmitProductChangeWorkflowInput) {
    const validate = createHook("validate", { input })

    const { data: changes } = useQueryGraphStep({
      entity: "product_change",
      fields: ["id", "status"],
      filters: { id: input.id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "pc-load-change" })

    const change = transform({ changes }, ({ changes }) => changes[0])

    validateProductChangeIsRequiresActionStep({ change })

    resubmitProductChangeStep({ id: input.id })

    emitEventStep({
      eventName: ProductChangeWorkflowEvents.RESUBMITTED,
      data: { id: input.id },
    })

    const productChangeResubmitted = createHook("productChangeResubmitted", {
      id: input.id,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, productChangeResubmitted],
    })
  },
)
