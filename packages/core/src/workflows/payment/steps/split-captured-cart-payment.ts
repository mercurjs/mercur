import { BigNumberInput, MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MathBN,
  Modules,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type { CapturePaymentWorkflowInput } from "@medusajs/medusa/core-flows"

import {
  allocateProportionally,
  CART_PAYMENT_COLLECTION_KEY,
  getCurrencyDecimalDigits,
  isOrderCanceled,
  loadSplitOrderPaymentGroup,
  SPLIT_ORDER_COLLECTIONS_FLAG,
  SplitOrderGroupPayment,
  SplitOrderPaymentGroupInput,
} from "../utils"
import { capturePaymentWorkflow } from "../workflows/payment-hooks"

export type SplitCapturedCartPaymentStepInput = SplitOrderPaymentGroupInput

// The payment module accepts `is_captured` to record a capture the provider
// already made; the workflow input type just does not declare it.
type RecordCaptureInput = CapturePaymentWorkflowInput & { is_captured: true }

// `createPaymentSession` always opens a new session at the provider, which
// would charge the customer again. An order's payment has to point at the
// charge the cart payment already holds, so its rows are written with the
// module's generated methods instead, the same two writes
// `authorizePaymentSession` makes. They exist on the service but not on
// `IPaymentModuleService`.
type PaymentRowWriter = {
  createPaymentSessions(
    data: {
      payment_collection_id: string
      provider_id: string
      currency_code: string
      amount: BigNumberInput
      data: Record<string, unknown>
      status: PaymentSessionStatus
      authorized_at: Date
    }[]
  ): Promise<{ id: string }[]>
  createPayments(
    data: {
      payment_collection_id: string
      payment_session: string
      provider_id: string
      currency_code: string
      amount: BigNumberInput
      data: Record<string, unknown>
    }[]
  ): Promise<{ id: string }[]>
}

const LOCK_TIMEOUT_SECONDS = 30

const total = (movements: { amount: BigNumberInput }[] | undefined) =>
  (movements ?? []).reduce(
    (acc, movement) => MathBN.add(acc, movement.amount),
    MathBN.convert(0)
  )

const createOrderPayment = async (
  container: MedusaContainer,
  input: {
    order_id: string
    cart_payment_collection_id: string
    cartPayment: SplitOrderGroupPayment
    amount: number
  }
): Promise<string> => {
  const paymentModule = container.resolve(Modules.PAYMENT)
  const writer = paymentModule as unknown as PaymentRowWriter
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const { cartPayment, amount } = input

  const collection = await paymentModule.createPaymentCollections({
    currency_code: cartPayment.currency_code,
    amount,
    metadata: {
      [CART_PAYMENT_COLLECTION_KEY]: input.cart_payment_collection_id,
    },
  })

  await link.create({
    [Modules.ORDER]: { order_id: input.order_id },
    [Modules.PAYMENT]: { payment_collection_id: collection.id },
  })

  const row = {
    payment_collection_id: collection.id,
    provider_id: cartPayment.provider_id,
    currency_code: cartPayment.currency_code,
    amount,
    data: cartPayment.data ?? {},
  }

  const [session] = await writer.createPaymentSessions([
    {
      ...row,
      status: PaymentSessionStatus.AUTHORIZED,
      authorized_at: new Date(),
    },
  ])
  const [payment] = await writer.createPayments([
    { ...row, payment_session: session.id },
  ])

  return payment.id
}

const splitCapturedCartPayment = async (
  container: MedusaContainer,
  cartId: string
): Promise<string[]> => {
  const group = await loadSplitOrderPaymentGroup(container, { cart_id: cartId })
  const cartPayment = group?.payment

  if (!group || !cartPayment || !group.orders.length) {
    return []
  }

  const captured = total(cartPayment.captures)

  if (!MathBN.gt(captured, 0)) {
    return []
  }

  const paymentModule = container.resolve(Modules.PAYMENT)
  const decimalDigits = getCurrencyDecimalDigits(cartPayment.currency_code)
  const weights = group.orders.map((order) => order.total)

  // What each order is entitled to of the authorization, and of the part of
  // it captured so far.
  const shares = allocateProportionally({
    amount: cartPayment.raw_amount ?? cartPayment.amount,
    weights,
    decimalDigits,
  })
  const targets = allocateProportionally({
    amount: captured,
    weights,
    decimalDigits,
  })

  const paymentIds: string[] = []
  let attributed = MathBN.convert(0)

  for (const [index, order] of group.orders.entries()) {
    const recorded = total(order.payment?.captures)
    attributed = MathBN.add(attributed, recorded)

    const missing = MathBN.sub(targets[index], recorded)

    // An order canceled before the capture is not paid: its part of the
    // charge stays unattributed and is refunded below.
    if (isOrderCanceled(order) || !MathBN.gt(missing, 0)) {
      continue
    }

    const paymentId =
      order.payment?.id ??
      (await createOrderPayment(container, {
        order_id: order.id,
        cart_payment_collection_id: group.payment_collection.id,
        cartPayment,
        amount: shares[index].toNumber(),
      }))

    const captureInput: RecordCaptureInput = {
      payment_id: paymentId,
      amount: missing.toNumber(),
      is_captured: true,
    }
    await capturePaymentWorkflow(container).run({ input: captureInput })

    attributed = MathBN.add(attributed, missing)
    paymentIds.push(paymentId)
  }

  if (!group.payment_collection.metadata?.[SPLIT_ORDER_COLLECTIONS_FLAG]) {
    await paymentModule.updatePaymentCollections(group.payment_collection.id, {
      metadata: {
        ...group.payment_collection.metadata,
        [SPLIT_ORDER_COLLECTIONS_FLAG]: true,
      },
    })
  }

  const unattributed = MathBN.sub(
    captured,
    attributed,
    total(cartPayment.refunds)
  )

  if (MathBN.gt(unattributed, 0)) {
    await paymentModule.refundPayment({
      payment_id: cartPayment.id,
      amount: unattributed.toNumber(),
      note: "Share of orders canceled before the payment was captured",
    })
  }

  return paymentIds
}

export const splitCapturedCartPaymentStepId = "split-captured-cart-payment"

/**
 * Once a cart's payment is captured, gives every order of the cart a payment
 * collection of its own: linked to the order, with a captured payment for the
 * order's share on the cart payment's provider, pointing at the same charge.
 * Medusa's refund and cancel workflows then apply to the order unchanged.
 *
 * What was charged for orders canceled before the capture is refunded against
 * the cart payment. The step only ever adds what is missing, so running it
 * again for the same capture changes nothing. It is not compensated: the
 * capture it records has already happened at the provider.
 */
export const splitCapturedCartPaymentStep = createStep(
  splitCapturedCartPaymentStepId,
  async (input: SplitCapturedCartPaymentStepInput, { container }) => {
    const group = await loadSplitOrderPaymentGroup(container, input)

    if (!group) {
      return new StepResponse([] as string[])
    }

    // Recording an order's capture emits `payment.captured` again, and two
    // runs working from the same snapshot would both record it. Runs for one
    // cart take turns and re-read under the lock.
    const paymentIds = await container
      .resolve(Modules.LOCKING)
      .execute(
        `split-order-payment:${group.cart_id}`,
        () => splitCapturedCartPayment(container, group.cart_id),
        { timeout: LOCK_TIMEOUT_SECONDS }
      )

    return new StepResponse(paymentIds)
  }
)
