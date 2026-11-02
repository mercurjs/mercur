import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"

import { deleteMagentoWebhookDeliveriesStep } from "../steps"

export type PruneMagentoWebhookDeliveriesWorkflowInput = {
  delivered_before: Date
  limit?: number
}

export const pruneMagentoWebhookDeliveriesWorkflowId = "prune-magento-webhook-deliveries"
export const pruneMagentoWebhookDeliveriesWorkflow = createWorkflow(
  pruneMagentoWebhookDeliveriesWorkflowId,
  (input: WorkflowData<PruneMagentoWebhookDeliveriesWorkflowInput>) => {
    const deleted = deleteMagentoWebhookDeliveriesStep(input)

    return new WorkflowResponse(deleted)
  }
)
