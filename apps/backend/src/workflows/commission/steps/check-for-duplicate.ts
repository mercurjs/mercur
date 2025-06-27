import { MedusaError } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMMISSION_MODULE } from '@mercurjs/commission'
import { CommissionModuleService } from '@mercurjs/commission'
import { CommissionRuleDTO, CreateCommissionRuleDTO } from '@mercurjs/framework'

export const checkForDuplicateStep = createStep(
  'check-for-rule-duplicate',
  async (input: CreateCommissionRuleDTO, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    const commissionRule: CommissionRuleDTO[] =
      await service.listCommissionRules({
        reference: input.reference,
        reference_id: input.reference_id,
        deleted_at: null
      })

    if (commissionRule.length > 0) {
      throw new MedusaError(MedusaError.Types.CONFLICT, 'Rule already exists!')
    }

    return new StepResponse(true)
  }
)
