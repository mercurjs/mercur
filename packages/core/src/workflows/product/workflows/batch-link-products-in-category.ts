import {
  createWorkflow,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"

import { batchLinkProductsToCategoryStep } from "../steps/batch-link-products-in-category"

export const batchLinkProductsToCategoryWorkflowId =
  "batch-link-products-to-category"

type BatchLinkProductsToCategoryWorkflowInput = {
  id: string
  add?: string[]
  remove?: string[]
}

export const batchLinkProductsToCategoryWorkflow = createWorkflow(
  batchLinkProductsToCategoryWorkflowId,
  (
    input: WorkflowData<BatchLinkProductsToCategoryWorkflowInput>
  ): WorkflowData<void> => {
    return batchLinkProductsToCategoryStep(input)
  }
)
