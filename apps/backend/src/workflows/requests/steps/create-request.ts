import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { REQUESTS_MODULE } from '../../../modules/requests'
import RequestsModuleService from '../../../modules/requests/service'
import { CreateRequestDTO } from '../../../modules/requests/types'

export const createRequestStep = createStep(
  'create-request',
  async (input: CreateRequestDTO, { container }) => {
    const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE)

    const request = await service.createRequests(input)

    return new StepResponse(request, request.id)
  }
)
