import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"

import { sendMagentoWebhookDeliveryStep, validateMagentoWebhookDeliveryStep } from "../steps"

export type DeliverMagentoWebhookWorkflowInput = {
  delivery_id: string
  endpoint_id?: string
  force?: boolean
}

export const deliverMagentoWebhookWorkflowId = "deliver-magento-webhook"
export const deliverMagentoWebhookWorkflow = createWorkflow(
  deliverMagentoWebhookWorkflowId,
  (input: WorkflowData<DeliverMagentoWebhookWorkflowInput>) => {
    const validated = validateMagentoWebhookDeliveryStep(input)
    const delivery = sendMagentoWebhookDeliveryStep(validated)

    return new WorkflowResponse(delivery)
  }
)
