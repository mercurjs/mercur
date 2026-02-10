import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateCommissionRuleDTO, MercurModules } from "@mercurjs/types"

import CommissionModuleService from "../../../modules/commission/service"

export const updateCommissionRulesStepId = "update-commission-rules-step"

export const updateCommissionRulesStep = createStep(
  updateCommissionRulesStepId,
  async (input: UpdateCommissionRuleDTO[], { container }) => {
    const commissionService = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    const previousRules = await commissionService.listCommissionRules({
      id: input.map((rule) => rule.id),
    })

    const commissionRules = await commissionService.updateCommissionRules(input)

    return new StepResponse(commissionRules, previousRules)
  },
  async (previousRules, { container }) => {
    if (!previousRules?.length) return

    const commissionService = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    await commissionService.updateCommissionRules(
      previousRules.map((rule) => ({
        id: rule.id,
        reference: rule.reference,
        reference_id: rule.reference_id,
      }))
    )
  }
)
