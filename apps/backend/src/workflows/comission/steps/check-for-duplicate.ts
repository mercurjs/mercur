import ComissionModuleService from 'src/modules/comission/service'

import { MedusaError } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMISSION_MODULE } from '../../../modules/comission'
import {
  ComissionRuleDTO,
  CreateComissionRuleDTO
} from '../../../modules/comission/types'

export const checkForDuplicateStep = createStep(
  'check-for-rule-duplicate',
  async (input: CreateComissionRuleDTO, { container }) => {
    const service = container.resolve<ComissionModuleService>(COMISSION_MODULE)

    const comissionRate: ComissionRuleDTO[] = await service.listComissionRules({
      reference: input.reference,
      reference_id: input.reference_id
    })

    if (comissionRate.length > 0) {
      throw new MedusaError(MedusaError.Types.CONFLICT, 'Rule already exists!')
    }

    return new StepResponse(true)
  }
)
