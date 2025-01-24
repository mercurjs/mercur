import CommissionModuleService from '#/modules/commission/service'

import { MedusaError } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMMISSION_MODULE } from '../../../modules/commission'
import {
  CommissionRuleDTO,
  CreateCommissionRuleDTO
} from '../../../modules/commission/types'

export const checkForDuplicateStep = createStep(
  'check-for-rule-duplicate',
  async (input: CreateCommissionRuleDTO, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    const commissionRate: CommissionRuleDTO[] =
      await service.listCommissionRules({
        reference: input.reference,
        reference_id: input.reference_id
      })

    if (commissionRate.length > 0) {
      throw new MedusaError(MedusaError.Types.CONFLICT, 'Rule already exists!')
    }

    return new StepResponse(true)
  }
)
