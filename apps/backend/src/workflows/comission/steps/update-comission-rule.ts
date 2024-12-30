import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMISSION_MODULE } from '../../../modules/comission'
import ComissionModuleService from '../../../modules/comission/service'
import {
  ComissionRuleDTO,
  UpdateComissionRuleDTO
} from '../../../modules/comission/types'

export const updateComissionRuleStep = createStep(
  'update-comission-rule',
  async (input: UpdateComissionRuleDTO, { container }) => {
    const service = container.resolve<ComissionModuleService>(COMISSION_MODULE)

    const previousData: ComissionRuleDTO = await service.retrieveComissionRule(
      input.id
    )

    const updatedComissionRule = await service.updateComissionRules(input)

    return new StepResponse(updatedComissionRule, previousData)
  },
  async (previousData: ComissionRuleDTO, { container }) => {
    const service = container.resolve<ComissionModuleService>(COMISSION_MODULE)

    await service.updateComissionRules(previousData)
  }
)
