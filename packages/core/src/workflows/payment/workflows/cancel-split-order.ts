import { OrderDTO, OrderWorkflow } from "@medusajs/framework/types"
import { PaymentCollectionStatus } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  addOrderTransactionStep,
  cancelOrderWorkflow,
  cancelPaymentStep,
  cancelValidateOrder,
  updatePaymentCollectionStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

import { getSplitOrderPaymentContextStep } from "../steps/get-split-order-payment-context"
import { refundSplitOrderSharesStep } from "../steps/refund-split-order-shares"
import {
  buildSplitOrderCaptureTransactions,
  isSplitOrderCanceled,
} from "../utils"

export const cancelSplitOrderWorkflowId = "cancel-split-order"

/**
 * Cancels an order together with its part of the cart's shared payment.
 *
 * Medusa's `cancelOrderWorkflow` only sees payments linked to the order, so on
 * a split order it voids and refunds nothing. This workflow refunds what the
 * order holds of the captured payment, runs the stock cancellation, and voids
 * the authorization once every order of the cart is canceled. While sibling
 * orders are still open the authorization is kept for them, and
 * `captureSplitOrderPaymentWorkflow` leaves the canceled share uncaptured.
 */
export const cancelSplitOrderWorkflow = createWorkflow(
  cancelSplitOrderWorkflowId,
  (input: OrderWorkflow.CancelOrderWorkflowInput) => {
    const orderQuery = useQueryGraphStep({
      entity: "order",
      fields: ["id", "status", "canceled_at", "fulfillments.canceled_at"],
      filters: { id: input.order_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-order-to-cancel" })

    const order = transform(
      { orderQuery },
      ({ orderQuery }) => orderQuery.data[0] as unknown as OrderDTO
    )

    // Validated up front: the refund below cannot be rolled back if the stock
    // cancellation rejects the order afterwards.
    cancelValidateOrder({ order, input })

    const context = getSplitOrderPaymentContextStep({
      order_id: input.order_id,
    })

    const unrecordedCaptures = transform({ context }, ({ context }) =>
      buildSplitOrderCaptureTransactions(context)
    )

    addOrderTransactionStep(unrecordedCaptures).config({
      name: "record-unrecorded-captures",
    })

    refundSplitOrderSharesStep({
      order_id: input.order_id,
      created_by: input.canceled_by,
    })

    cancelOrderWorkflow.runAsStep({ input })

    const release = transform({ context, input }, ({ context, input }) => {
      const lastOpenOrder =
        context.is_split &&
        context.orders
          .filter((o) => o.id !== input.order_id)
          .every(isSplitOrderCanceled)

      if (!lastOpenOrder) {
        return { payment_ids: [], payment_collection_ids: [] }
      }

      return {
        payment_ids: context.payments
          .filter((p) => !p.captures.length && !p.canceled_at)
          .map((p) => p.id),
        payment_collection_ids: [context.payment_collection_id as string],
      }
    })

    cancelPaymentStep({ paymentIds: release.payment_ids })

    when("cancel-shared-payment-collection", { release }, ({ release }) => {
      return release.payment_collection_ids.length > 0
    }).then(() => {
      updatePaymentCollectionStep({
        selector: { id: release.payment_collection_ids },
        update: { status: PaymentCollectionStatus.CANCELED },
      })
    })

    return new WorkflowResponse(void 0)
  }
)
