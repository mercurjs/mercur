import { MedusaError } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { UpdateRequestDataDTO } from '@mercurjs/framework'
import { REQUESTS_MODULE, RequestsModuleService } from '@mercurjs/requests'

export const updateRequestDataStep = createStep(
  'update-request-data',
  async (input: UpdateRequestDataDTO, { container }) => {
    const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE)

    const existingRequest = await service.retrieveRequest(input.id)

    if (!['pending', 'draft'].includes(existingRequest.status)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Request is already reviewed!'
      )
    }

    if (existingRequest.type !== input.type) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Invalid request type!'
      )
    }

    const request = await service.updateRequests({
      id: input.id,
      data: {
        ...existingRequest.data,
        ...input.data
      }
    })

    return new StepResponse(request, request.id)
  }
)
