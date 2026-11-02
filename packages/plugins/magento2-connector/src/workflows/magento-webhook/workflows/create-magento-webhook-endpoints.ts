import { randomBytes } from "node:crypto"

import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"

import { CreateMagentoWebhookEndpointDTO } from "../../../types"
import { createMagentoWebhookEndpointsStep } from "../steps"

export type CreateMagentoWebhookEndpointsWorkflowInput = {
  endpoints: (Omit<CreateMagentoWebhookEndpointDTO, "secret"> & { secret?: string })[]
}

export const createMagentoWebhookEndpointsWorkflowId = "create-magento-webhook-endpoints"
export const createMagentoWebhookEndpointsWorkflow = createWorkflow(
  createMagentoWebhookEndpointsWorkflowId,
  (input: WorkflowData<CreateMagentoWebhookEndpointsWorkflowInput>) => {
    const data = transform({ input }, ({ input }) =>
      input.endpoints.map((endpoint) => ({
        ...endpoint,
        secret: endpoint.secret ?? randomBytes(32).toString("hex"),
      }))
    )

    const endpoints = createMagentoWebhookEndpointsStep(data)

    return new WorkflowResponse(endpoints)
  }
)
