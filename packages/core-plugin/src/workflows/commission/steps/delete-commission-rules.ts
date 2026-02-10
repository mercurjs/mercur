import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import CommissionModuleService from "../../../modules/commission/service"

export const deleteCommissionRulesStepId = "delete-commission-rules-step"

export const deleteCommissionRulesStep = createStep(
  deleteCommissionRulesStepId,
  async (ids: string[], { container }) => {
    const commissionService = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    const previousRules = await commissionService.listCommissionRules({
      id: ids,
    })

    await commissionService.deleteCommissionRules(ids)

    return new StepResponse(ids, previousRules)
  },
  async (previousRules, { container }) => {
    if (!previousRules?.length) return

    const commissionService = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    await commissionService.createCommissionRules(
      previousRules.map((rule) => ({
        reference: rule.reference,
        reference_id: rule.reference_id,
        commission_rate_id: rule.commission_rate_id,
      }))
    )
  }
)
