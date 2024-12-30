import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMISSION_MODULE } from '../../../modules/comission'
import ComissionModuleService from '../../../modules/comission/service'

export const deleteComissionRuleStep = createStep(
  'delete-comission-rule',
  async (id: string, { container }) => {
    const service = container.resolve<ComissionModuleService>(COMISSION_MODULE)

    await service.softDeleteComissionRules(id)

    return new StepResponse(id)
  },
  async (id: string, { container }) => {
    const service = container.resolve<ComissionModuleService>(COMISSION_MODULE)

    await service.restoreComissionRules(id)
  }
)
