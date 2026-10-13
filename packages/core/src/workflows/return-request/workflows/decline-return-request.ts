import { AdditionalData } from "@medusajs/framework/types"
import {
  MedusaError,
  OrderChangeStatus,
  ReturnStatus,
} from "@medusajs/framework/utils"
import {
  createHook,
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  when,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  cancelFulfillmentWorkflow,
  cancelReturnWorkflow,
  declineOrderChangeWorkflow,
  emitEventStep,
  updateReturnsStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import {
  ReturnRequestActorType,
  ReturnRequestDTO,
  ReturnRequestStatus,
} from "@mercurjs/types"

import { ReturnRequestWorkflowEvents } from "../events"
import {
  updateReturnRequestStep,
  validateReturnRequestStatusStep,
} from "../steps"

export type DeclineReturnRequestWorkflowInput = {
  id: string
  declined_by?: string
  declined_by_type: ReturnRequestActorType
  decline_reason: string
  decline_code?: string
} & AdditionalData

const DECLINABLE_STATUSES = [
  ReturnRequestStatus.PENDING,
  ReturnRequestStatus.ACCEPTED,
  ReturnRequestStatus.AWAITING_RETURN,
  ReturnRequestStatus.RETURNED,
]

export const declineReturnRequestValidationStep = createStep(
  "rr-decline-return-request-validation",
  async (input: {
    request: { id: string; status: string }
    declined_by_type: ReturnRequestActorType
  }) => {
    if (
      input.declined_by_type === ReturnRequestActorType.SELLER &&
      input.request.status === ReturnRequestStatus.ACCEPTED
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Return request '${input.request.id}' was already accepted without a return. Only the operator can decline it now.`
      )
    }

    return new StepResponse(void 0)
  }
)

export type DeclineReturnRequestWorkflowHooks = [
  Hook<
    "returnRequestDeclined",
    {
      id: string
      return_id: string
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const declineReturnRequestWorkflowId = "decline-return-request"

export const declineReturnRequestWorkflow: ReturnWorkflow<
  DeclineReturnRequestWorkflowInput,
  ReturnRequestDTO,
  DeclineReturnRequestWorkflowHooks
> = createWorkflow(
  declineReturnRequestWorkflowId,
  function (input: DeclineReturnRequestWorkflowInput) {
    const { data: requests } = useQueryGraphStep({
      entity: "return_request",
      fields: ["id", "status", "return_id", "order_id"],
      filters: { id: input.id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "rr-load-request" })

    const request = transform({ requests }, ({ requests }) => requests[0])

    validateReturnRequestStatusStep({
      request,
      expected: DECLINABLE_STATUSES,
    })

    declineReturnRequestValidationStep({
      request,
      declined_by_type: input.declined_by_type,
    })

    const { data: returns } = useQueryGraphStep({
      entity: "return",
      fields: ["id", "status", "fulfillments.id", "fulfillments.canceled_at"],
      filters: { id: request.return_id },
    }).config({ name: "rr-load-return" })

    const { data: orderChanges } = useQueryGraphStep({
      entity: "order_change",
      fields: ["id", "status"],
      filters: {
        return_id: request.return_id,
        status: [OrderChangeStatus.PENDING, OrderChangeStatus.REQUESTED],
      },
    }).config({ name: "rr-load-order-change" })

    const plan = transform(
      { request, returns, orderChanges },
      ({ request, returns, orderChanges }) => {
        const orderReturn = returns[0]
        const openFulfillment = (orderReturn?.fulfillments ?? []).find(
          (fulfillment) => fulfillment && !fulfillment.canceled_at
        )

        return {
          pending_change_id: orderChanges[0]?.id ?? null,
          cancel_return:
            request.status === ReturnRequestStatus.ACCEPTED ||
            request.status === ReturnRequestStatus.AWAITING_RETURN,
          open_fulfillment_id: openFulfillment?.id ?? null,
          return_is_open: orderReturn?.status === ReturnStatus.OPEN,
        }
      }
    )

    when({ plan }, ({ plan }) => !!plan.pending_change_id).then(() => {
      declineOrderChangeWorkflow.runAsStep({
        input: {
          id: plan.pending_change_id!,
          declined_by: input.declined_by,
        },
      })
    })

    when({ plan }, ({ plan }) => plan.return_is_open).then(() => {
      updateReturnsStep([
        {
          id: request.return_id,
          status: ReturnStatus.CANCELED,
        },
      ])
    })

    when({ plan }, ({ plan }) => !!plan.open_fulfillment_id).then(() => {
      cancelFulfillmentWorkflow.runAsStep({
        input: { id: plan.open_fulfillment_id! },
      })
    })

    when({ plan }, ({ plan }) => plan.cancel_return).then(() => {
      cancelReturnWorkflow.runAsStep({
        input: {
          return_id: request.return_id,
          canceled_by: input.declined_by,
        },
      })
    })

    const updateInput = transform({ input }, ({ input }) => ({
      id: input.id,
      status: ReturnRequestStatus.DECLINED,
      declined_by: input.declined_by ?? null,
      declined_by_type: input.declined_by_type,
      declined_at: new Date(),
      decline_reason: input.decline_reason,
      decline_code: input.decline_code ?? null,
    }))

    const updated = updateReturnRequestStep(updateInput)

    emitEventStep({
      eventName: ReturnRequestWorkflowEvents.DECLINED,
      data: { id: input.id, return_id: request.return_id },
    })

    const returnRequestDeclined = createHook("returnRequestDeclined", {
      id: input.id,
      return_id: request.return_id,
      additional_data: input.additional_data,
    })

    const result = transform(
      { updated },
      ({ updated }) => updated as unknown as ReturnRequestDTO
    )

    return new WorkflowResponse(result, {
      hooks: [returnRequestDeclined],
    })
  }
)
