import { PaymentCollectionStatus, PaymentEvents } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  addOrderTransactionStep,
  cancelPaymentStep,
  createPaymentCollectionsStep,
  createRemoteLinkStep,
  emitEventStep,
  refundPaymentsStep,
  releaseLockStep,
  updatePaymentCollectionStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

import { createOrderPaymentsStep } from "../steps/create-order-payments"
import { recordPaymentCapturesStep } from "../steps/record-payment-captures"
import {
  buildOrderPaymentCollectionLinks,
  cartOrderFields,
  cartPaymentCollectionFields,
  planCartPaymentSplit,
  planCartPaymentVoid,
  SplitOrderGroupCollection,
  SplitOrderGroupOrder,
} from "../utils"

/**
 * The cart whose payment to split.
 */
export type SplitCapturedCartPaymentWorkflowInput = {
  /**
   * The ID of the cart.
   */
  cart_id: string
}

const LOCK_TIMEOUT_SECONDS = 30
const LOCK_TTL_SECONDS = 120

type CartPaymentCollectionLink = {
  payment_collection?: SplitOrderGroupCollection | null
}

type CartOrderLink = { order?: SplitOrderGroupOrder | null }

const toOrders = (links: CartOrderLink[]) =>
  links.flatMap((link) => link.order ?? [])

export const splitCapturedCartPaymentWorkflowId = "split-captured-cart-payment"
/**
 * This workflow splits a captured cart payment between the orders of the
 * cart. Every order gets a payment collection of its own, linked to the order,
 * with a captured payment for the order's share on the cart payment's provider
 * and pointing at the same charge, so Medusa's refund and cancel workflows
 * apply to the order. What was charged for orders canceled before the capture
 * is refunded against the cart payment.
 *
 * The workflow only adds what is missing: it does nothing until the cart
 * payment has a capture, and nothing when run again for the same capture.
 *
 * @example
 * const { result } = await splitCapturedCartPaymentWorkflow(container)
 * .run({
 *   input: {
 *     cart_id: "cart_123",
 *   }
 * })
 *
 * @summary
 *
 * Split a captured cart payment into a payment per order.
 */
export const splitCapturedCartPaymentWorkflow = createWorkflow(
  splitCapturedCartPaymentWorkflowId,
  (input: SplitCapturedCartPaymentWorkflowInput) => {
    // Not the cart id itself: checkout holds that lock while it runs this
    // workflow as a step.
    const lockKey = transform(
      { input },
      ({ input }) => `split-order-payment:${input.cart_id}`
    )

    acquireLockStep({
      key: lockKey,
      timeout: LOCK_TIMEOUT_SECONDS,
      ttl: LOCK_TTL_SECONDS,
    })

    const cartPaymentQuery = useQueryGraphStep({
      entity: "cart_payment_collection",
      fields: cartPaymentCollectionFields,
      filters: { cart_id: input.cart_id },
    }).config({ name: "get-cart-payment-collection" })

    const cartOrdersQuery = useQueryGraphStep({
      entity: "order_cart",
      fields: cartOrderFields,
      filters: { cart_id: input.cart_id },
    }).config({ name: "get-cart-orders" })

    const plan = transform(
      { cartPaymentQuery, cartOrdersQuery },
      ({ cartPaymentQuery, cartOrdersQuery }) =>
        planCartPaymentSplit(
          (cartPaymentQuery.data[0] as CartPaymentCollectionLink | undefined)
            ?.payment_collection,
          toOrders(cartOrdersQuery.data as CartOrderLink[])
        )
    )

    const collections = createPaymentCollectionsStep(plan.collections)

    const links = transform({ plan, collections }, ({ plan, collections }) =>
      buildOrderPaymentCollectionLinks(plan, collections)
    )

    createRemoteLinkStep(links).config({
      name: "link-order-payment-collections",
    })

    const paymentsToCreate = transform(
      { plan, collections },
      ({ plan, collections }) => {
        const createdByOrder = new Map(
          plan.collections.map((collection, index) => [
            collection.order_id,
            collections[index].id,
          ])
        )

        return plan.payments.map(({ order_id, ...payment }) => ({
          ...payment,
          payment_collection_id:
            payment.payment_collection_id ??
            (createdByOrder.get(order_id) as string),
        }))
      }
    )

    const payments = createOrderPaymentsStep(paymentsToCreate)

    const capturesToRecord = transform(
      { plan, payments },
      ({ plan, payments }) => {
        const createdByOrder = new Map(
          plan.payments.map((payment, index) => [
            payment.order_id,
            payments[index].id,
          ])
        )

        return plan.captures.map((capture) => ({
          payment_id:
            capture.payment_id ??
            (createdByOrder.get(capture.order_id) as string),
          amount: capture.amount,
        }))
      }
    )

    const capturedPayments = recordPaymentCapturesStep(capturesToRecord)

    const orderTransactions = transform(
      { plan, capturedPayments },
      ({ plan, capturedPayments }) => [
        ...plan.recorded.map((capture) => ({
          order_id: capture.order_id,
          amount: capture.amount,
          currency_code: capture.currency_code,
          reference: "capture",
          reference_id: capture.capture_id,
        })),
        ...capturedPayments.flatMap((payment, index) =>
          (payment.captures ?? []).map((capture) => ({
            order_id: plan.captures[index].order_id,
            amount: capture.raw_amount ?? capture.amount,
            currency_code: payment.currency_code,
            reference: "capture",
            reference_id: capture.id,
          }))
        ),
      ]
    )

    addOrderTransactionStep(orderTransactions)

    when("flag-cart-payment-collection", { plan }, ({ plan }) => {
      return !!plan.cart_payment_collection
    }).then(() => {
      updatePaymentCollectionStep({
        selector: { id: plan.cart_payment_collection!.id },
        update: { metadata: plan.cart_payment_collection!.metadata },
      })
    })

    refundPaymentsStep(plan.refunds)

    const capturedEvents = transform(
      { capturedPayments },
      ({ capturedPayments }) =>
        capturedPayments.map((payment) => ({ id: payment.id }))
    )

    emitEventStep({
      eventName: PaymentEvents.CAPTURED,
      data: capturedEvents,
    })

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(capturedPayments)
  }
)

/**
 * The cart whose payment to void.
 */
export type VoidCanceledCartPaymentWorkflowInput = {
  /**
   * The ID of the cart.
   */
  cart_id: string
}

export const voidCanceledCartPaymentWorkflowId = "void-canceled-cart-payment"
/**
 * This workflow voids a cart's payment once every order of the cart is
 * canceled. Until it is captured, the authorization is shared by the cart's
 * orders, so canceling a single order leaves it in place. The workflow does
 * nothing while an order is still open or once the payment is captured.
 *
 * @example
 * const { result } = await voidCanceledCartPaymentWorkflow(container)
 * .run({
 *   input: {
 *     cart_id: "cart_123",
 *   }
 * })
 *
 * @summary
 *
 * Void a cart's payment when all of its orders are canceled.
 */
export const voidCanceledCartPaymentWorkflow = createWorkflow(
  voidCanceledCartPaymentWorkflowId,
  (input: VoidCanceledCartPaymentWorkflowInput) => {
    const cartPaymentQuery = useQueryGraphStep({
      entity: "cart_payment_collection",
      fields: cartPaymentCollectionFields,
      filters: { cart_id: input.cart_id },
    }).config({ name: "get-cart-payment-collection" })

    const cartOrdersQuery = useQueryGraphStep({
      entity: "order_cart",
      fields: cartOrderFields,
      filters: { cart_id: input.cart_id },
    }).config({ name: "get-cart-orders" })

    const plan = transform(
      { cartPaymentQuery, cartOrdersQuery },
      ({ cartPaymentQuery, cartOrdersQuery }) =>
        planCartPaymentVoid(
          (cartPaymentQuery.data[0] as CartPaymentCollectionLink | undefined)
            ?.payment_collection,
          toOrders(cartOrdersQuery.data as CartOrderLink[])
        )
    )

    cancelPaymentStep({ paymentIds: plan.payment_ids })

    when("cancel-cart-payment-collection", { plan }, ({ plan }) => {
      return plan.payment_collection_ids.length > 0
    }).then(() => {
      updatePaymentCollectionStep({
        selector: { id: plan.payment_collection_ids },
        update: { status: PaymentCollectionStatus.CANCELED },
      })
    })

    return new WorkflowResponse(plan)
  }
)
