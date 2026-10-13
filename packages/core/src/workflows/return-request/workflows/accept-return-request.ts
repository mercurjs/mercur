import { AdditionalData, OrderPreviewDTO } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
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
  confirmReturnRequestWorkflow,
  createReturnShippingMethodWorkflow,
  emitEventStep,
  updateReturnWorkflow,
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

export type AcceptReturnRequestWorkflowInput = {
  id: string
  accepted_by?: string
  accepted_by_type: ReturnRequestActorType
  return_required: boolean
  location_id?: string
  shipping_option_id?: string
  custom_amount?: number
} & AdditionalData

export const acceptReturnRequestValidationStep = createStep(
  "rr-accept-return-request-validation",
  async (input: { return_required: boolean; location_id?: string }) => {
    if (input.return_required && !input.location_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "A location is required when the item has to be returned."
      )
    }

    return new StepResponse(void 0)
  }
)

export type AcceptReturnRequestWorkflowOutput = {
  return_request: ReturnRequestDTO
  order_preview: OrderPreviewDTO
}

export type AcceptReturnRequestWorkflowHooks = [
  Hook<
    "returnRequestAccepted",
    {
      id: string
      return_id: string
      return_required: boolean
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const acceptReturnRequestWorkflowId = "accept-return-request"

export const acceptReturnRequestWorkflow: ReturnWorkflow<
  AcceptReturnRequestWorkflowInput,
  AcceptReturnRequestWorkflowOutput,
  AcceptReturnRequestWorkflowHooks
> = createWorkflow(
  acceptReturnRequestWorkflowId,
  function (input: AcceptReturnRequestWorkflowInput) {
    const { data: requests } = useQueryGraphStep({
      entity: "return_request",
      fields: ["id", "status", "return_id", "order_id"],
      filters: { id: input.id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "rr-load-request" })

    const request = transform({ requests }, ({ requests }) => requests[0])

    validateReturnRequestStatusStep({
      request,
      expected: [ReturnRequestStatus.PENDING],
    })

    acceptReturnRequestValidationStep({
      return_required: input.return_required,
      location_id: input.location_id,
    })

    when({ input }, ({ input }) => input.return_required).then(() => {
      updateReturnWorkflow.runAsStep({
        input: {
          return_id: request.return_id,
          location_id: input.location_id,
        },
      })
    })

    when(
      { input },
      ({ input }) => input.return_required && !!input.shipping_option_id
    ).then(() => {
      createReturnShippingMethodWorkflow.runAsStep({
        input: {
          return_id: request.return_id,
          shipping_option_id: input.shipping_option_id!,
          custom_amount: input.custom_amount,
        },
      })
    })

    const orderPreview = confirmReturnRequestWorkflow.runAsStep({
      input: {
        return_id: request.return_id,
        confirmed_by: input.accepted_by,
      },
    })

    const updateInput = transform({ input }, ({ input }) => ({
      id: input.id,
      status: input.return_required
        ? ReturnRequestStatus.AWAITING_RETURN
        : ReturnRequestStatus.ACCEPTED,
      return_required: input.return_required,
      accepted_by: input.accepted_by ?? null,
      accepted_by_type: input.accepted_by_type,
      accepted_at: new Date(),
    }))

    const updated = updateReturnRequestStep(updateInput)

    emitEventStep({
      eventName: ReturnRequestWorkflowEvents.ACCEPTED,
      data: {
        id: input.id,
        return_id: request.return_id,
        return_required: input.return_required,
      },
    })

    const returnRequestAccepted = createHook("returnRequestAccepted", {
      id: input.id,
      return_id: request.return_id,
      return_required: input.return_required,
      additional_data: input.additional_data,
    })

    const result = transform(
      { updated, orderPreview },
      ({ updated, orderPreview }) => ({
        return_request: updated as unknown as ReturnRequestDTO,
        order_preview: orderPreview,
      })
    )

    return new WorkflowResponse(result, {
      hooks: [returnRequestAccepted],
    })
  }
)
