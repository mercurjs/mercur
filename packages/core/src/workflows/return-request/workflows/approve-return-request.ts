import { AdditionalData, BigNumberInput } from "@medusajs/framework/types"
import { MathBN, MedusaError } from "@medusajs/framework/utils"
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
  emitEventStep,
  updateReturnsStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { ReturnRequestDTO, ReturnRequestStatus } from "@mercurjs/types"

import { refundPaymentWorkflow } from "../../payment/workflows/payment-hooks"
import { ReturnRequestWorkflowEvents } from "../events"
import {
  updateReturnRequestStep,
  validateReturnRequestStatusStep,
} from "../steps"

export type ApproveReturnRequestWorkflowInput = {
  id: string
  approved_by?: string
  refund_amount?: BigNumberInput
  refund_note?: string
  refund_shipping?: boolean
} & AdditionalData

type RefundablePayment = {
  id: string
  captured_at: Date | string | null
  canceled_at: Date | string | null
  captures?: { amount: BigNumberInput }[] | null
  refunds?: { amount: BigNumberInput }[] | null
}

type ResolveRefundablePaymentStepInput = {
  order_id: string
  amount: BigNumberInput
  payments: RefundablePayment[]
}

export const resolveRefundablePaymentStep = createStep(
  "rr-resolve-refundable-payment",
  async ({ order_id, amount, payments }: ResolveRefundablePaymentStepInput) => {
    if (MathBN.lte(amount, 0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The refund amount must be greater than zero."
      )
    }

    const payment = payments.find((candidate) => {
      if (!candidate.captured_at || candidate.canceled_at) {
        return false
      }

      const captured = (candidate.captures ?? []).reduce(
        (sum, capture) => MathBN.add(sum, capture.amount),
        MathBN.convert(0)
      )
      const refunded = (candidate.refunds ?? []).reduce(
        (sum, refund) => MathBN.add(sum, refund.amount),
        MathBN.convert(0)
      )

      return MathBN.gte(MathBN.sub(captured, refunded), amount)
    })

    if (!payment) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Order ${order_id} has no captured payment with enough balance to refund ${MathBN.convert(amount).toString()}.`
      )
    }

    return new StepResponse({ payment_id: payment.id })
  }
)

export type ApproveReturnRequestWorkflowHooks = [
  Hook<
    "returnRequestRefunded",
    {
      id: string
      return_id: string
      order_id: string
      amount: BigNumberInput
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const approveReturnRequestWorkflowId = "approve-return-request"

export const approveReturnRequestWorkflow: ReturnWorkflow<
  ApproveReturnRequestWorkflowInput,
  ReturnRequestDTO,
  ApproveReturnRequestWorkflowHooks
> = createWorkflow(
  approveReturnRequestWorkflowId,
  function (input: ApproveReturnRequestWorkflowInput) {
    const { data: requests } = useQueryGraphStep({
      entity: "return_request",
      fields: ["id", "status", "return_id", "order_id"],
      filters: { id: input.id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "rr-load-request" })

    const request = transform({ requests }, ({ requests }) => requests[0])

    validateReturnRequestStatusStep({
      request,
      expected: [ReturnRequestStatus.ACCEPTED, ReturnRequestStatus.RETURNED],
    })

    const { data: returns } = useQueryGraphStep({
      entity: "return",
      fields: [
        "id",
        "items.quantity",
        "items.item.unit_price",
        "shipping_methods.shipping_method.amount",
      ],
      filters: { id: request.return_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "rr-load-return" })

    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "payment_collections.payments.id",
        "payment_collections.payments.captured_at",
        "payment_collections.payments.canceled_at",
        "payment_collections.payments.captures.amount",
        "payment_collections.payments.refunds.amount",
      ],
      filters: { id: request.order_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "rr-load-order-payments" })

    const refund = transform(
      { input, returns, orders },
      ({ input, returns, orders }) => {
        const orderReturn = returns[0]

        const itemsTotal = (orderReturn?.items ?? []).reduce(
          (sum, returnItem) =>
            MathBN.add(
              sum,
              MathBN.mult(
                returnItem?.item?.unit_price ?? 0,
                returnItem?.quantity ?? 0
              )
            ),
          MathBN.convert(0)
        )

        const shippingTotal = (orderReturn?.shipping_methods ?? []).reduce(
          (sum, orderShipping) =>
            MathBN.add(sum, orderShipping?.shipping_method?.amount ?? 0),
          MathBN.convert(0)
        )

        const computed = input.refund_shipping
          ? MathBN.add(itemsTotal, shippingTotal)
          : itemsTotal

        const amount: BigNumberInput =
          input.refund_amount !== undefined
            ? input.refund_amount
            : computed.toString()

        const payments: RefundablePayment[] = (
          orders[0]?.payment_collections ?? []
        ).flatMap((collection) => collection?.payments ?? [])

        return { amount, payments }
      }
    )

    const { payment_id } = resolveRefundablePaymentStep({
      order_id: request.order_id,
      amount: refund.amount,
      payments: refund.payments,
    })

    refundPaymentWorkflow.runAsStep({
      input: {
        payment_id,
        amount: refund.amount,
        created_by: input.approved_by,
        note: input.refund_note,
      },
    })

    updateReturnsStep([
      {
        id: request.return_id,
        refund_amount: refund.amount,
      },
    ])

    const updateInput = transform({ input, refund }, ({ input, refund }) => ({
      id: input.id,
      status: ReturnRequestStatus.REFUNDED,
      refunded_by: input.approved_by ?? null,
      refunded_at: new Date(),
      refund_amount: MathBN.convert(refund.amount).toNumber(),
      refund_note: input.refund_note ?? null,
    }))

    const updated = updateReturnRequestStep(updateInput)

    emitEventStep({
      eventName: ReturnRequestWorkflowEvents.REFUNDED,
      data: {
        id: input.id,
        return_id: request.return_id,
        order_id: request.order_id,
        amount: refund.amount,
      },
    })

    const returnRequestRefunded = createHook("returnRequestRefunded", {
      id: input.id,
      return_id: request.return_id,
      order_id: request.order_id,
      amount: refund.amount,
      additional_data: input.additional_data,
    })

    const result = transform(
      { updated },
      ({ updated }) => updated as unknown as ReturnRequestDTO
    )

    return new WorkflowResponse(result, {
      hooks: [returnRequestRefunded],
    })
  }
)
