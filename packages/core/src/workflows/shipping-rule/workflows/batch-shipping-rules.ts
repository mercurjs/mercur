import {
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  CreateShippingRuleDTO,
  UpdateShippingRuleDTO,
} from "@mercurjs/types"

import { deleteShippingRulesStep, upsertShippingRulesStep } from "../steps"

export type BatchShippingRulesWorkflowInput = {
  create?: CreateShippingRuleDTO[]
  update?: UpdateShippingRuleDTO[]
  delete?: string[]
}

export const batchShippingRulesWorkflowId = "batch-shipping-rules"

export const batchShippingRulesWorkflow = createWorkflow(
  batchShippingRulesWorkflowId,
  (input: WorkflowData<BatchShippingRulesWorkflowInput>) => {
    const upserted = upsertShippingRulesStep(
      transform({ input }, ({ input }) => ({
        create: input.create ?? [],
        update: input.update ?? [],
      }))
    )

    deleteShippingRulesStep(
      transform({ input }, ({ input }) => input.delete ?? [])
    )

    const result = transform({ input, upserted }, ({ input, upserted }) => {
      const updateIds = new Set((input.update ?? []).map((rule) => rule.id))
      return {
        created: upserted.filter((rule) => !updateIds.has(rule.id)),
        updated: upserted.filter((rule) => updateIds.has(rule.id)),
        deleted: input.delete ?? [],
      }
    })

    return new WorkflowResponse(result)
  }
)
