import ComissionModuleService from 'src/modules/comission/service'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMISSION_MODULE } from '../../../modules/comission'
import {
  ComissionRuleDTO,
  CreateComissionRuleDTO
} from '../../../modules/comission/types'

export const createComissionRuleStep = createStep(
  'create-comission-rule',
  async (input: CreateComissionRuleDTO, { container }) => {
    const service = container.resolve<ComissionModuleService>(COMISSION_MODULE)

    const comissionRule: ComissionRuleDTO =
      await service.createComissionRules(input)

    return new StepResponse(comissionRule, comissionRule.id)
  },
  async (comissionRuleId: string, { container }) => {
    const service = container.resolve<ComissionModuleService>(COMISSION_MODULE)

    await service.deleteComissionRules([comissionRuleId])
  }
)
