import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { updateFilterRuleStep } from "../steps/update-filter-rule"
import { invalidateFilterCacheStep } from "../steps/invalidate-filter-cache"

type UpdateFilterRuleWorkflowInput = {
  id: string
  match_type?: "exact" | "contains"
  pattern?: string
  description?: string | null
  is_enabled?: boolean
}

export const updateFilterRuleWorkflow = createWorkflow(
  { name: "update-filter-rule" },
  function (input: UpdateFilterRuleWorkflowInput) {
    const rule = updateFilterRuleStep(input)

    invalidateFilterCacheStep()

    return new WorkflowResponse(rule)
  }
)
