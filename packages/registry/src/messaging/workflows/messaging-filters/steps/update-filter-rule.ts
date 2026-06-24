import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_FILTERS_MODULE } from "../../../modules/messaging-filters"
import type MessagingFiltersModuleService from "../../../modules/messaging-filters/service"

type UpdateFilterRuleInput = {
  id: string
  match_type?: "exact" | "contains"
  pattern?: string
  description?: string | null
  is_enabled?: boolean
}

export const updateFilterRuleStep = createStep(
  "update-filter-rule",
  async (input: UpdateFilterRuleInput, { container }) => {
    const service = container.resolve<MessagingFiltersModuleService>(
      MESSAGING_FILTERS_MODULE
    )

    // Retrieve current state for compensation
    const existing = await service.listFilterRules({ id: input.id })
    if (!existing || existing.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Filter rule ${input.id} not found`
      )
    }

    const current = existing[0]!

    // Built-in rules: only allow is_enabled and description changes
    if (current.is_builtin) {
      if (input.match_type || input.pattern) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Built-in filter rules can only be enabled or disabled"
        )
      }
    }

    const updateData: Record<string, any> = { id: input.id }
    if (input.is_enabled !== undefined) updateData.is_enabled = input.is_enabled
    if (input.description !== undefined) updateData.description = input.description
    if (input.pattern !== undefined && !current.is_builtin) updateData.pattern = input.pattern
    if (input.match_type !== undefined && !current.is_builtin) updateData.match_type = input.match_type

    const updated = await service.updateFilterRules(updateData)

    return new StepResponse(updated, {
      id: input.id,
      is_enabled: current.is_enabled,
      description: current.description,
      pattern: current.pattern,
      match_type: current.match_type,
    })
  },
  async (previousData: any, { container }) => {
    if (!previousData) return

    const service = container.resolve<MessagingFiltersModuleService>(
      MESSAGING_FILTERS_MODULE
    )
    await service.updateFilterRules(previousData)
  }
)
