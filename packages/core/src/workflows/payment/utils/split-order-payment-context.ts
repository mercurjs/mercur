import { BigNumberInput, MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MathBN,
  MedusaError,
  OrderStatus,
} from "@medusajs/framework/utils"

import {
  allocateProportionally,
  getCurrencyDecimalDigits,
  getOrderCapturedBalance,
  SplitOrderTransaction,
} from "./split-order-payment"

type PaymentMovement = {
  id: string
  amount?: BigNumberInput | null
  raw_amount?: BigNumberInput | null
}

export type SplitOrderPayment = {
  id: string
  currency_code: string
  amount: BigNumberInput
  raw_amount?: BigNumberInput | null
  payment_collection_id: string
  canceled_at?: Date | string | null
  captures: PaymentMovement[]
  refunds: PaymentMovement[]
}

export type SplitOrderSnapshot = {
  id: string
  status: string
  canceled_at?: Date | string | null
  currency_code: string
  total: BigNumberInput
  summary?: {
    pending_difference?: BigNumberInput | null
    raw_pending_difference?: BigNumberInput | null
  } | null
  transactions: SplitOrderTransaction[]
}

export type SplitOrderPaymentContext = {
  /**
   * True when the collection is the cart's shared one, reachable only through
   * `order.cart.payment_collection`. False when Medusa's own
   * order↔payment_collection link exists (e.g. a collection created by an order
   * edit), in which case `orders` holds just the linked order.
   */
  is_split: boolean
  payment_collection_id: string | null
  payments: SplitOrderPayment[]
  orders: SplitOrderSnapshot[]
}

export type SplitOrderPaymentContextInput =
  | { payment_id: string; order_id?: never }
  | { order_id: string; payment_id?: never }

const PAYMENT_FIELDS = [
  "id",
  "currency_code",
  "amount",
  "raw_amount",
  "payment_collection_id",
  "canceled_at",
  "captures.id",
  "captures.amount",
  "captures.raw_amount",
  "refunds.id",
  "refunds.amount",
  "refunds.raw_amount",
]

const ORDER_FIELDS = [
  "id",
  "status",
  "canceled_at",
  "currency_code",
  "total",
  "summary",
  "transactions.id",
  "transactions.reference",
  "transactions.reference_id",
  "transactions.amount",
  "transactions.raw_amount",
]

const EMPTY_CONTEXT: SplitOrderPaymentContext = {
  is_split: false,
  payment_collection_id: null,
  payments: [],
  orders: [],
}

export const isSplitOrderCanceled = (order: {
  status: string
  canceled_at?: Date | string | null
}) => order.status === OrderStatus.CANCELED || !!order.canceled_at

export const loadSplitOrderPaymentContext = async (
  container: MedusaContainer,
  input: SplitOrderPaymentContextInput
): Promise<SplitOrderPaymentContext> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  let paymentCollectionId: string | undefined

  if (input.payment_id) {
    const {
      data: [payment],
    } = await query.graph({
      entity: "payment",
      fields: ["id", "payment_collection_id"],
      filters: { id: input.payment_id },
    })

    if (!payment) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Payment with id: ${input.payment_id} was not found`
      )
    }

    paymentCollectionId = payment.payment_collection_id
  } else {
    const {
      data: [orderCart],
    } = await query.graph({
      entity: "order_cart",
      fields: ["cart_id"],
      filters: { order_id: input.order_id },
    })

    if (!orderCart?.cart_id) {
      return EMPTY_CONTEXT
    }

    const {
      data: [cartPaymentCollection],
    } = await query.graph({
      entity: "cart_payment_collection",
      fields: ["payment_collection_id"],
      filters: { cart_id: orderCart.cart_id },
    })

    paymentCollectionId = cartPaymentCollection?.payment_collection_id
  }

  if (!paymentCollectionId) {
    return EMPTY_CONTEXT
  }

  const [
    {
      data: [orderLink],
    },
    {
      data: [cartLink],
    },
    { data: payments },
  ] = await Promise.all([
    query.graph({
      entity: "order_payment_collection",
      fields: ["order_id"],
      filters: { payment_collection_id: paymentCollectionId },
    }),
    query.graph({
      entity: "cart_payment_collection",
      fields: ["cart_id"],
      filters: { payment_collection_id: paymentCollectionId },
    }),
    query.graph({
      entity: "payment",
      fields: PAYMENT_FIELDS,
      filters: { payment_collection_id: paymentCollectionId },
    }),
  ])

  let orderIds: string[] = []
  if (orderLink?.order_id) {
    orderIds = [orderLink.order_id]
  } else if (cartLink?.cart_id) {
    const { data: orderCarts } = await query.graph({
      entity: "order_cart",
      fields: ["order_id"],
      filters: { cart_id: cartLink.cart_id },
    })
    orderIds = orderCarts.map((link) => link.order_id)
  }

  const orders = orderIds.length
    ? (
        await query.graph({
          entity: "order",
          fields: ORDER_FIELDS,
          filters: { id: orderIds },
        })
      ).data
    : []

  return {
    is_split: !orderLink?.order_id && orders.length > 0,
    payment_collection_id: paymentCollectionId,
    payments: payments as unknown as SplitOrderPayment[],
    orders: orders as unknown as SplitOrderSnapshot[],
  }
}

type OrderTransactionInput = {
  order_id: string
  amount: BigNumberInput
  currency_code: string
  reference: string
  reference_id: string
}

const getOutstanding = (order: SplitOrderSnapshot) =>
  isSplitOrderCanceled(order)
    ? MathBN.convert(0)
    : MathBN.max(
        MathBN.sub(order.total, getOrderCapturedBalance(order.transactions)),
        0
      )

const sum = (values: BigNumberInput[]) =>
  values.reduce<BigNumberInput>((acc, value) => MathBN.add(acc, value), 0)

/**
 * Order transactions for every capture on the collection that no order has
 * recorded yet. Each capture is shared between the orders that are not
 * canceled, in proportion to what they still have outstanding.
 */
export const buildSplitOrderCaptureTransactions = (
  context: SplitOrderPaymentContext,
  payments: SplitOrderPayment[] = context.payments
): OrderTransactionInput[] => {
  if (!context.is_split) {
    return []
  }

  const recorded = new Set(
    context.orders.flatMap((order) =>
      (order.transactions ?? [])
        .filter((transaction) => transaction.reference === "capture")
        .map((transaction) => transaction.reference_id)
    )
  )

  const outstanding = context.orders.map(getOutstanding)
  const transactions: OrderTransactionInput[] = []

  for (const payment of payments) {
    const decimalDigits = getCurrencyDecimalDigits(payment.currency_code)

    for (const capture of payment.captures ?? []) {
      if (recorded.has(capture.id)) {
        continue
      }

      const activeTotals = context.orders.map((order) =>
        isSplitOrderCanceled(order) ? 0 : order.total
      )
      const weights = MathBN.gt(sum(outstanding), 0)
        ? outstanding
        : MathBN.gt(sum(activeTotals), 0)
        ? activeTotals
        : context.orders.map((order) => order.total)

      const shares = allocateProportionally({
        amount: capture.raw_amount ?? capture.amount ?? 0,
        weights,
        decimalDigits,
      })

      shares.forEach((share, index) => {
        if (!MathBN.gt(share, 0)) {
          return
        }
        transactions.push({
          order_id: context.orders[index].id,
          amount: share,
          currency_code: payment.currency_code,
          reference: "capture",
          reference_id: capture.id,
        })
        outstanding[index] = MathBN.max(
          MathBN.sub(outstanding[index], share),
          0
        )
      })
    }
  }

  return transactions
}

/**
 * A capture without an explicit amount takes the whole authorization. Once a
 * sibling order is canceled its share must stay uncaptured, so the capture is
 * narrowed to what the remaining orders still owe.
 */
export const getSplitOrderCaptureAmount = (
  context: SplitOrderPaymentContext,
  paymentId: string,
  requested?: BigNumberInput | null
): BigNumberInput | undefined => {
  if (requested != null) {
    return requested
  }

  if (!context.is_split || !context.orders.some(isSplitOrderCanceled)) {
    return undefined
  }

  const payment = context.payments.find((p) => p.id === paymentId)
  if (!payment) {
    return undefined
  }

  const authorized = MathBN.sub(
    payment.raw_amount ?? payment.amount,
    sum(payment.captures.map((c) => c.raw_amount ?? c.amount ?? 0))
  )
  const owed = sum(context.orders.map(getOutstanding))
  const amount = MathBN.min(authorized, owed)

  return MathBN.gt(amount, 0) ? amount.toNumber() : undefined
}
