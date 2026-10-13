import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { ReturnRequestDTO, ReturnRequestStatus } from "@mercurjs/types"

import { ReturnRequestWorkflowEvents } from "../events"
import {
  updateReturnRequestStep,
  validateReturnRequestStatusStep,
} from "../steps"

export type MarkReturnRequestReturnedWorkflowInput = {
  id: string
}

export const markReturnRequestReturnedWorkflowId =
  "mark-return-request-returned"

export const markReturnRequestReturnedWorkflow = createWorkflow(
  markReturnRequestReturnedWorkflowId,
  function (
    input: MarkReturnRequestReturnedWorkflowInput
  ): WorkflowResponse<ReturnRequestDTO> {
    const { data: requests } = useQueryGraphStep({
      entity: "return_request",
      fields: ["id", "status", "return_id", "order_id"],
      filters: { id: input.id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "rr-load-request" })

    const request = transform({ requests }, ({ requests }) => requests[0])

    validateReturnRequestStatusStep({
      request,
      expected: [ReturnRequestStatus.AWAITING_RETURN],
    })

    const updated = updateReturnRequestStep({
      id: request.id,
      status: ReturnRequestStatus.RETURNED,
    })

    emitEventStep({
      eventName: ReturnRequestWorkflowEvents.RETURNED,
      data: {
        id: request.id,
        return_id: request.return_id,
        order_id: request.order_id,
      },
    })

    const result = transform(
      { updated },
      ({ updated }) => updated as unknown as ReturnRequestDTO
    )

    return new WorkflowResponse(result)
  }
)
