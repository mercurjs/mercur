import { AdditionalData } from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductChangeDTO, ProductChangeDTO } from "@mercurjs/types"

import { ProductChangeWorkflowEvents } from "../events"
import {
  createProductChangesStep,
  validateNoPendingProductChangeStep,
} from "../steps"

export type CreateProductChangeWorkflowInput = {
  changes: CreateProductChangeDTO[]
} & AdditionalData

export type CreateProductChangeWorkflowHooks = [
  Hook<"validate", { input: CreateProductChangeWorkflowInput }, unknown>,
  Hook<
    "productChangeCreated",
    {
      changes: ProductChangeDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const createProductChangeWorkflowId = "create-product-change"

export const createProductChangeWorkflow: ReturnWorkflow<
  CreateProductChangeWorkflowInput,
  ProductChangeDTO[],
  CreateProductChangeWorkflowHooks
> = createWorkflow(
  createProductChangeWorkflowId,
  function (input: CreateProductChangeWorkflowInput) {
    const validate = createHook("validate", { input })

    const productIds = transform({ input }, ({ input }) =>
      Array.from(new Set(input.changes.map((c) => c.product_id))),
    )

    validateNoPendingProductChangeStep({ product_ids: productIds })

    const changes = createProductChangesStep(input.changes)

    emitEventStep({
      eventName: ProductChangeWorkflowEvents.CREATED,
      data: transform({ changes }, ({ changes }) =>
        changes.map((c) => ({ id: c.id })),
      ),
    })

    const productChangeCreated = createHook("productChangeCreated", {
      changes,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(changes as ProductChangeDTO[], {
      hooks: [validate, productChangeCreated],
    })
  },
)
