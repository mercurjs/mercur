import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { voidCanceledCartPaymentWorkflow } from "@mercurjs/core/workflows"

import {
  cancelOrderGroupOrdersStep,
  resolveExternalCartPaymentStep,
  validateExternalPaymentCancelableStep,
} from "../steps"

export type CancelExternalPaymentWorkflowInput = {
  order_group_id: string
  reference?: string
  canceled_by?: string
}

export const cancelExternalPaymentWorkflowId = "cancel-external-payment"
/**
 * Mirrors a storefront cancellation of an order whose payment was never
 * captured: every child order is canceled, which releases the shared cart
 * authorization on the external provider.
 */
export const cancelExternalPaymentWorkflow = createWorkflow(
  cancelExternalPaymentWorkflowId,
  (input: WorkflowData<CancelExternalPaymentWorkflowInput>) => {
    const groups = useQueryGraphStep({
      entity: "order_group",
      fields: ["id", "orders.id"],
      filters: { id: input.order_group_id },
      options: { throwIfKeyNotFound: true },
    })

    const orderIds = transform({ groups }, ({ groups }) =>
      (groups.data[0]?.orders ?? []).flatMap((o) => (o ? [o.id] : []))
    )

    const payment = resolveExternalCartPaymentStep(
      transform({ input, orderIds }, ({ input, orderIds }) => ({
        order_group_id: input.order_group_id,
        order_ids: orderIds,
      }))
    )

    validateExternalPaymentCancelableStep(
      transform({ input, payment }, ({ input, payment }) => ({
        order_group_id: input.order_group_id,
        payment,
      }))
    )

    cancelOrderGroupOrdersStep(
      transform({ input, orderIds }, ({ input, orderIds }) => ({
        order_ids: orderIds,
        canceled_by: input.canceled_by,
      }))
    )

    voidCanceledCartPaymentWorkflow.runAsStep({
      input: transform({ payment }, ({ payment }) => ({ cart_id: payment.cart_id })),
    })

    return new WorkflowResponse(payment)
  }
)
