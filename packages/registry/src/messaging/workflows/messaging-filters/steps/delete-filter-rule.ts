import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_FILTERS_MODULE } from "../../../modules/messaging-filters"
import type MessagingFiltersModuleService from "../../../modules/messaging-filters/service"

type DeleteFilterRuleInput = {
  id: string
}

export const deleteFilterRuleStep = createStep(
  "delete-filter-rule",
  async (input: DeleteFilterRuleInput, { container }) => {
    const service = container.resolve<MessagingFiltersModuleService>(
      MESSAGING_FILTERS_MODULE
    )

    const existing = await service.listFilterRules({ id: input.id })
    if (!existing || existing.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Filter rule ${input.id} not found`
      )
    }

    const current = existing[0]!

    if (current.is_builtin) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Built-in filter rules cannot be deleted"
      )
    }

    await service.deleteFilterRules([input.id])

    return new StepResponse(undefined, current)
  },
  async (previousData: any, { container }) => {
    if (!previousData) return

    const service = container.resolve<MessagingFiltersModuleService>(
      MESSAGING_FILTERS_MODULE
    )
    await service.createFilterRules(previousData)
  }
)
