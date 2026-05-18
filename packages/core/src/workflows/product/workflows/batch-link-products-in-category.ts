import {
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"

import { batchLinkProductsToCategoryStep } from "../steps/batch-link-products-in-category"
import { createIdempotentWorkflow } from "../../utils/create-idempotent-workflow"

export const batchLinkProductsToCategoryWorkflowId =
  "batch-link-products-to-category"

type BatchLinkProductsToCategoryWorkflowInput = {
  id: string
  add?: string[]
  remove?: string[]
}

export const batchLinkProductsToCategoryWorkflow = createIdempotentWorkflow(
  batchLinkProductsToCategoryWorkflowId,
  (
    input: WorkflowData<BatchLinkProductsToCategoryWorkflowInput>
  ): WorkflowData<void> => {
    return batchLinkProductsToCategoryStep(input)
  }
)
