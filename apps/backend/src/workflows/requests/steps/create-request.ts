import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { REQUESTS_MODULE } from '../../../modules/requests'
import RequestsModuleService from '../../../modules/requests/service'
import { CreateRequestDTO } from '../../../modules/requests/types'

export const createRequestStep = createStep(
  'create-request',
  async (input: CreateRequestDTO | CreateRequestDTO[], { container }) => {
    const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE)

    const toCreate = Array.isArray(input) ? input : [input]

    const requests = await service.createRequests(toCreate)

    return new StepResponse(requests)
  }
)
