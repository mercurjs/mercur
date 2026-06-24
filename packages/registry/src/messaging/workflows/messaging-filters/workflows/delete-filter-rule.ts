import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { deleteFilterRuleStep } from "../steps/delete-filter-rule"
import { invalidateFilterCacheStep } from "../steps/invalidate-filter-cache"

type DeleteFilterRuleWorkflowInput = {
  id: string
}

export const deleteFilterRuleWorkflow = createWorkflow(
  { name: "delete-filter-rule" },
  function (input: DeleteFilterRuleWorkflowInput) {
    deleteFilterRuleStep(input)

    invalidateFilterCacheStep()

    const result = transform(input, (data) => ({
      id: data.id,
      deleted: true,
    }))

    return new WorkflowResponse(result)
  }
)
