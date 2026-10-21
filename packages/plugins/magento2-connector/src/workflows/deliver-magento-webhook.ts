import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"

import { sendMagentoWebhookDeliveryStep } from "./steps"

export type DeliverMagentoWebhookWorkflowInput = {
  delivery_id: string
}

export const deliverMagentoWebhookWorkflowId = "deliver-magento-webhook"

export const deliverMagentoWebhookWorkflow = createWorkflow(
  deliverMagentoWebhookWorkflowId,
  (input: WorkflowData<DeliverMagentoWebhookWorkflowInput>) => {
    const delivery = sendMagentoWebhookDeliveryStep(input)

    return new WorkflowResponse(delivery)
  }
)
