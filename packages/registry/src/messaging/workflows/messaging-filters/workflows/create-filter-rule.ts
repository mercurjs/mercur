import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { createFilterRuleStep } from "../steps/create-filter-rule"
import { invalidateFilterCacheStep } from "../steps/invalidate-filter-cache"

type CreateFilterRuleWorkflowInput = {
  match_type: "exact" | "contains"
  pattern: string
  description?: string | null
  is_enabled?: boolean
}

export const createFilterRuleWorkflow = createWorkflow(
  { name: "create-filter-rule" },
  function (input: CreateFilterRuleWorkflowInput) {
    const rule = createFilterRuleStep(input)

    invalidateFilterCacheStep()

    return new WorkflowResponse(rule)
  }
)
