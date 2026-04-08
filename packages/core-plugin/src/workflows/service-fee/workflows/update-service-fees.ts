import {
  WorkflowResponse,
  createWorkflow,
  createStep,
  StepResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { UpdateServiceFeeDTO, MercurModules } from "@mercurjs/types"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

import { updateServiceFeesStep } from "../steps/update-service-fees"
import { logServiceFeeChangeStep } from "../steps/log-service-fee-change"

const fetchPriorStateStepId = "fetch-prior-state-step"
const fetchPriorStateStep = createStep(
  fetchPriorStateStepId,
  async (input: UpdateServiceFeeDTO[], { container }) => {
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    const priorStates = await Promise.all(
      input.map(async (dto) => {
        const [fee] = await service.listServiceFees({ id: dto.id })
        return fee ? JSON.parse(JSON.stringify(fee)) : null
      })
    )
    return new StepResponse(priorStates.filter(Boolean))
  }
)

export const updateServiceFeesWorkflowId = "update-service-fees"

export const updateServiceFeesWorkflow = createWorkflow(
  updateServiceFeesWorkflowId,
  function (input: UpdateServiceFeeDTO[]) {
    const priorStates = fetchPriorStateStep(input)
    const serviceFees = updateServiceFeesStep(input)

    const logInput = transform(
      { serviceFees, priorStates, input },
      (data) => {
        const fee = Array.isArray(data.serviceFees)
          ? data.serviceFees[0]
          : data.serviceFees
        const prior = Array.isArray(data.priorStates)
          ? data.priorStates[0]
          : data.priorStates
        return {
          service_fee_id: fee?.id ?? data.input[0]?.id ?? "",
          action: "updated",
          changed_by: null,
          previous_snapshot: prior ?? null,
          new_snapshot: fee ? JSON.parse(JSON.stringify(fee)) : null,
        }
      }
    )

    logServiceFeeChangeStep(logInput)

    return new WorkflowResponse(serviceFees)
  }
)
