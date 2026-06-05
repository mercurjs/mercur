import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { createSellerDefaultRolesStep } from "../steps/create-seller-default-roles"

export const createSellerDefaultsWorkflowId = "create-seller-defaults"

export const createSellerDefaultsWorkflow = createWorkflow(
  createSellerDefaultsWorkflowId,
  () => {
    createSellerDefaultRolesStep()

    return new WorkflowResponse(void 0)
  }
)
