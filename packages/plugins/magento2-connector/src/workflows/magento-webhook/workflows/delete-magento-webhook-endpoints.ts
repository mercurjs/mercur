import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"

import { deleteMagentoWebhookEndpointsStep } from "../steps"

export type DeleteMagentoWebhookEndpointsWorkflowInput = { ids: string[] }

export const deleteMagentoWebhookEndpointsWorkflowId = "delete-magento-webhook-endpoints"
export const deleteMagentoWebhookEndpointsWorkflow = createWorkflow(
  deleteMagentoWebhookEndpointsWorkflowId,
  (input: WorkflowData<DeleteMagentoWebhookEndpointsWorkflowInput>) => {
    const deleted = deleteMagentoWebhookEndpointsStep(input.ids)

    return new WorkflowResponse(deleted)
  }
)
