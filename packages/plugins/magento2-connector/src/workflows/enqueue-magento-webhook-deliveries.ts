import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { MagentoWebhookEvents } from "../types"
import { createMagentoWebhookDeliveriesStep } from "./steps"

export type EnqueueMagentoWebhookDeliveriesWorkflowInput = {
  event: string
  payload: Record<string, unknown>
}

export const enqueueMagentoWebhookDeliveriesWorkflowId =
  "enqueue-magento-webhook-deliveries"

export const enqueueMagentoWebhookDeliveriesWorkflow = createWorkflow(
  enqueueMagentoWebhookDeliveriesWorkflowId,
  (input: WorkflowData<EnqueueMagentoWebhookDeliveriesWorkflowInput>) => {
    const deliveries = createMagentoWebhookDeliveriesStep(input)

    emitEventStep({
      eventName: MagentoWebhookEvents.DELIVERY_CREATED,
      data: transform({ deliveries }, ({ deliveries }) =>
        deliveries.map((d) => ({ id: d.id }))
      ),
    })

    return new WorkflowResponse(deliveries)
  }
)
