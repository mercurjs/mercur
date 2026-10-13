import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateReturnRequestDTO, MercurModules } from "@mercurjs/types"

import type ReturnRequestModuleService from "../../../modules/return-request/service"

export const createReturnRequestStepId = "rr-create-return-request"

export const createReturnRequestStep = createStep(
  createReturnRequestStepId,
  async (input: CreateReturnRequestDTO, { container }) => {
    const service = container.resolve<ReturnRequestModuleService>(
      MercurModules.RETURN_REQUEST
    )

    const [request] = await service.createReturnRequests([input])

    return new StepResponse(request, request.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }

    const service = container.resolve<ReturnRequestModuleService>(
      MercurModules.RETURN_REQUEST
    )

    await service.deleteReturnRequests([id])
  }
)
