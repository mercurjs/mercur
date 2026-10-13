import { AdditionalData, OrderPreviewDTO } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import {
  createHook,
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  beginReturnOrderWorkflow,
  emitEventStep,
  previewOrderChangeStep,
  requestItemReturnWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { ReturnRequestActorType, ReturnRequestDTO } from "@mercurjs/types"

import { ReturnRequestWorkflowEvents } from "../events"
import { createReturnRequestStep } from "../steps"

export type CreateReturnRequestWorkflowInput = {
  order_id: string
  items: {
    id: string
    quantity: number
    reason_id?: string
    note?: string
  }[]
  description?: string
  attachments?: string[]
  requested_by?: string
  requested_by_type: ReturnRequestActorType
  seller_id?: string
  customer_id?: string
} & AdditionalData

type CreateReturnRequestValidationStepInput = {
  order: {
    id: string
    canceled_at: Date | string | null
    customer_id: string | null
    seller?: { id: string } | null
  }
  seller_id?: string
  customer_id?: string
}

export const createReturnRequestValidationStep = createStep(
  "rr-create-return-request-validation",
  async ({
    order,
    seller_id,
    customer_id,
  }: CreateReturnRequestValidationStepInput) => {
    if (order.canceled_at) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order with id ${order.id} has been canceled.`
      )
    }

    if (!order.seller?.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order with id ${order.id} is not assigned to a seller.`
      )
    }

    if (seller_id && order.seller.id !== seller_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order with id: ${order.id} was not found`
      )
    }

    if (customer_id && order.customer_id !== customer_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order with id: ${order.id} was not found`
      )
    }

    return new StepResponse(void 0)
  }
)

export type CreateReturnRequestWorkflowOutput = {
  return_request: ReturnRequestDTO
  order_preview: OrderPreviewDTO
}

export type CreateReturnRequestWorkflowHooks = [
  Hook<
    "returnRequestCreated",
    {
      id: string
      return_id: string
      order_id: string
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const createReturnRequestWorkflowId = "create-return-request"

export const createReturnRequestWorkflow: ReturnWorkflow<
  CreateReturnRequestWorkflowInput,
  CreateReturnRequestWorkflowOutput,
  CreateReturnRequestWorkflowHooks
> = createWorkflow(
  createReturnRequestWorkflowId,
  function (input: CreateReturnRequestWorkflowInput) {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: ["id", "canceled_at", "customer_id", "seller.id"],
      filters: { id: input.order_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "rr-load-order" })

    const order = transform({ orders }, ({ orders }) => orders[0])

    createReturnRequestValidationStep({
      order,
      seller_id: input.seller_id,
      customer_id: input.customer_id,
    })

    const orderChange = beginReturnOrderWorkflow.runAsStep({
      input: {
        order_id: input.order_id,
        created_by: input.requested_by,
        description: input.description,
      },
    })

    const requestItemsInput = transform(
      { orderChange, input },
      ({ orderChange, input }) => ({
        return_id: orderChange.return_id!,
        items: input.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          reason_id: item.reason_id,
          note: item.note,
        })),
      })
    )

    requestItemReturnWorkflow.runAsStep({ input: requestItemsInput })

    const createInput = transform(
      { orderChange, order, input },
      ({ orderChange, order, input }) => ({
        return_id: orderChange.return_id!,
        order_id: order.id,
        seller_id: order.seller!.id,
        customer_id: order.customer_id,
        requested_by: input.requested_by ?? null,
        requested_by_type: input.requested_by_type,
        note: input.description ?? null,
        attachments: input.attachments ?? [],
      })
    )

    const request = createReturnRequestStep(createInput)

    emitEventStep({
      eventName: ReturnRequestWorkflowEvents.CREATED,
      data: { id: request.id },
    })

    const returnRequestCreated = createHook("returnRequestCreated", {
      id: request.id,
      return_id: request.return_id,
      order_id: request.order_id,
      additional_data: input.additional_data,
    })

    const orderPreview = previewOrderChangeStep(input.order_id)

    const result = transform(
      { request, orderPreview },
      ({ request, orderPreview }) => ({
        return_request: request as unknown as ReturnRequestDTO,
        order_preview: orderPreview,
      })
    )

    return new WorkflowResponse(result, {
      hooks: [returnRequestCreated],
    })
  }
)
