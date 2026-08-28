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

    const guardInput = transform({ input }, ({ input }) => {
      const actors = new Set(input.changes.map((c) => c.created_by))

      return {
        product_ids: Array.from(new Set(input.changes.map((c) => c.product_id))),
        // A batch spanning several actors falls back to product-wide scoping.
        created_by: actors.size === 1 ? input.changes[0].created_by : undefined,
      }
    })

    validateNoPendingProductChangeStep(guardInput)

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
