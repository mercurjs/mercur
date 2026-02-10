import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateCommissionRuleDTO, MercurModules } from "@mercurjs/types"

import CommissionModuleService from "../../../modules/commission/service"

export interface CreateCommissionRulesStepInput {
  commission_rate_id: string
  rules: CreateCommissionRuleDTO[]
}

export const createCommissionRulesStepId = "create-commission-rules-step"

export const createCommissionRulesStep = createStep(
  createCommissionRulesStepId,
  async (input: CreateCommissionRulesStepInput, { container }) => {
    const commissionService = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    const rulesWithRateId = input.rules.map((rule) => ({
      ...rule,
      commission_rate_id: input.commission_rate_id,
    }))

    const commissionRules =
      await commissionService.createCommissionRules(rulesWithRateId)

    return new StepResponse(
      commissionRules,
      commissionRules.map((rule) => rule.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) return

    const commissionService = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    await commissionService.deleteCommissionRules(ids)
  }
)
