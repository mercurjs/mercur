import { MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  cancelReturnRequestWorkflow,
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { ReturnRequestDTO, ReturnRequestStatus } from "@mercurjs/types"

import { ReturnRequestWorkflowEvents } from "../events"
import {
  updateReturnRequestStep,
  validateReturnRequestStatusStep,
} from "../steps"

export type WithdrawReturnRequestWorkflowInput = {
  id: string
  customer_id?: string
}

export const withdrawReturnRequestValidationStep = createStep(
  "rr-withdraw-return-request-validation",
  async (input: {
    request: { id: string; customer_id: string | null }
    customer_id?: string
  }) => {
    if (input.customer_id && input.request.customer_id !== input.customer_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Return request with id: ${input.request.id} was not found`
      )
    }

    return new StepResponse(void 0)
  }
)

export const withdrawReturnRequestWorkflowId = "withdraw-return-request"

export const withdrawReturnRequestWorkflow = createWorkflow(
  withdrawReturnRequestWorkflowId,
  function (
    input: WithdrawReturnRequestWorkflowInput
  ): WorkflowResponse<ReturnRequestDTO> {
    const { data: requests } = useQueryGraphStep({
      entity: "return_request",
      fields: ["id", "status", "return_id", "order_id", "customer_id"],
      filters: { id: input.id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "rr-load-request" })

    const request = transform({ requests }, ({ requests }) => requests[0])

    validateReturnRequestStatusStep({
      request,
      expected: [ReturnRequestStatus.PENDING],
    })

    withdrawReturnRequestValidationStep({
      request,
      customer_id: input.customer_id,
    })

    cancelReturnRequestWorkflow.runAsStep({
      input: { return_id: request.return_id },
    })

    const updated = updateReturnRequestStep({
      id: input.id,
      status: ReturnRequestStatus.WITHDRAWN,
      withdrawn_at: new Date(),
    })

    emitEventStep({
      eventName: ReturnRequestWorkflowEvents.WITHDRAWN,
      data: { id: input.id, return_id: request.return_id },
    })

    const result = transform(
      { updated },
      ({ updated }) => updated as unknown as ReturnRequestDTO
    )

    return new WorkflowResponse(result)
  }
)
