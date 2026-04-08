import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { UpdateServiceFeeDTO } from "@mercurjs/types"

import { updateServiceFeesStep } from "../steps/update-service-fees"
import { logServiceFeeChangeStep } from "../steps/log-service-fee-change"

export const updateServiceFeesWorkflowId = "update-service-fees"

export const updateServiceFeesWorkflow = createWorkflow(
  updateServiceFeesWorkflowId,
  function (input: UpdateServiceFeeDTO[]) {
    const serviceFees = updateServiceFeesStep(input)

    const logInput = transform({ serviceFees, input }, (data) => {
      const fee = Array.isArray(data.serviceFees)
        ? data.serviceFees[0]
        : data.serviceFees
      return {
        service_fee_id: fee?.id ?? data.input[0]?.id ?? "",
        action: "updated",
        changed_by: null,
        previous_snapshot: null,
        new_snapshot: fee ? JSON.parse(JSON.stringify(fee)) : null,
      }
    })

    logServiceFeeChangeStep(logInput)

    return new WorkflowResponse(serviceFees)
  }
)
