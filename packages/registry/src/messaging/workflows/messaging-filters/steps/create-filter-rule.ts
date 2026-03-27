import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { MESSAGING_FILTERS_MODULE } from "../../../modules/messaging-filters"
import type MessagingFiltersModuleService from "../../../modules/messaging-filters/service"

type CreateFilterRuleInput = {
  match_type: "exact" | "contains"
  pattern: string
  description?: string | null
  is_enabled?: boolean
}

export const createFilterRuleStep = createStep(
  "create-filter-rule",
  async (input: CreateFilterRuleInput, { container }) => {
    const service = container.resolve<MessagingFiltersModuleService>(
      MESSAGING_FILTERS_MODULE
    )

    const rule = await service.createFilterRules({
      match_type: input.match_type,
      pattern: input.pattern,
      description: input.description ?? null,
      is_enabled: input.is_enabled ?? true,
      is_builtin: false,
    })

    return new StepResponse(rule, rule.id)
  },
  async (ruleId, { container }) => {
    if (!ruleId) return

    const service = container.resolve<MessagingFiltersModuleService>(
      MESSAGING_FILTERS_MODULE
    )
    await service.deleteFilterRules([ruleId])
  }
)
