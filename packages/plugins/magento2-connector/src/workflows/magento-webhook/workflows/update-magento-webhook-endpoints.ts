import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"

import { UpdateMagentoWebhookEndpointDTO } from "../../../types"
import { updateMagentoWebhookEndpointsStep } from "../steps"

export type UpdateMagentoWebhookEndpointsWorkflowInput = {
  endpoints: UpdateMagentoWebhookEndpointDTO[]
}

export const updateMagentoWebhookEndpointsWorkflowId = "update-magento-webhook-endpoints"
export const updateMagentoWebhookEndpointsWorkflow = createWorkflow(
  updateMagentoWebhookEndpointsWorkflowId,
  (input: WorkflowData<UpdateMagentoWebhookEndpointsWorkflowInput>) => {
    const endpoints = updateMagentoWebhookEndpointsStep(input.endpoints)

    return new WorkflowResponse(endpoints)
  }
)
