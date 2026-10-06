import {
  BigNumberInput,
  LinkDefinition,
  MedusaContainer,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MathBN,
  Modules,
  OrderStatus,
} from "@medusajs/framework/utils"

import {
  allocateProportionally,
  getCurrencyDecimalDigits,
} from "./split-order-payment"

/** Set on a cart's payment collection once it is split into its orders'. */
export const SPLIT_ORDER_COLLECTIONS_FLAG = "split_order_collections"

/** Set on an order's payment collection, pointing at the cart's. */
export const CART_PAYMENT_COLLECTION_KEY = "cart_payment_collection_id"

type PaymentMovement = {
  id: string
  amount: BigNumberInput
  raw_amount?: BigNumberInput | null
}

export type SplitOrderGroupPayment = {
  id: string
  provider_id: string
  currency_code: string
  amount: BigNumberInput
  raw_amount?: BigNumberInput | null
  data?: Record<string, unknown> | null
  captured_at?: Date | string | null
  canceled_at?: Date | string | null
  captures?: PaymentMovement[] | null
  refunds?: PaymentMovement[] | null
}

export type SplitOrderGroupCollection = {
  id: string
  currency_code: string
  metadata?: Record<string, unknown> | null
  payments?: SplitOrderGroupPayment[] | null
}

export type SplitOrderGroupOrder = {
  id: string
  status: string
  canceled_at?: Date | string | null
  total: BigNumberInput
  payment_collections?: SplitOrderGroupCollection[] | null
}

const PAYMENT_FIELDS = [
  "id",
  "provider_id",
  "currency_code",
  "amount",
  "raw_amount",
  "data",
  "captured_at",
  "canceled_at",
  "captures.id",
  "captures.amount",
  "captures.raw_amount",
  "refunds.id",
  "refunds.amount",
  "refunds.raw_amount",
]

const COLLECTION_FIELDS = [
  "id",
  "currency_code",
  "metadata",
  ...PAYMENT_FIELDS.map((field) => `payments.${field}`),
]

/** Fields to query on `cart_payment_collection` to plan a split or a void. */
export const cartPaymentCollectionFields = COLLECTION_FIELDS.map(
  (field) => `payment_collection.${field}`
)

/** Fields to query on `order_cart` to plan a split or a void. */
export const cartOrderFields = [
  "order.id",
  "order.status",
  "order.canceled_at",
  "order.total",
  ...COLLECTION_FIELDS.map((field) => `order.payment_collections.${field}`),
]

const amountOf = (movement: {
  amount: BigNumberInput
  raw_amount?: BigNumberInput | null
}) => movement.raw_amount ?? movement.amount

const sum = (movements: PaymentMovement[] | null | undefined) =>
  (movements ?? []).reduce(
    (acc, movement) => MathBN.add(acc, amountOf(movement)),
    MathBN.convert(0)
  )

export const isPaymentCaptured = (payment: SplitOrderGroupPayment) =>
  !!payment.captured_at || (payment.captures ?? []).length > 0

export const isOrderCanceled = (order: {
  status: string
  canceled_at?: Date | string | null
}) => order.status === OrderStatus.CANCELED || !!order.canceled_at

export const hasSplitOrderCollections = (
  paymentCollection?: { metadata?: Record<string, unknown> | null } | null
) => paymentCollection?.metadata?.[SPLIT_ORDER_COLLECTIONS_FLAG] === true

/**
 * The payment collections that pay for an order. Until the cart payment is
 * captured that is the cart's shared collection; afterwards the order has its
 * own. An order canceled before the capture never gets one and keeps showing
 * the cart's.
 */
export const resolveOrderPaymentCollections = (order: {
  cart?: {
    payment_collection?: { metadata?: Record<string, unknown> | null } | null
  } | null
  payment_collections?: unknown[]
}): unknown[] => {
  const own = order.payment_collections ?? []
  const cartPaymentCollection = order.cart?.payment_collection

  if (!cartPaymentCollection) {
    return own
  }

  return hasSplitOrderCollections(cartPaymentCollection) && own.length
    ? own
    : [cartPaymentCollection]
}

/**
 * Resolves the cart a payment or an order belongs to. A payment can be the
 * cart's own or one created for an order when the cart payment was split.
 */
export const resolveSplitOrderCartId = async (
  container: MedusaContainer,
  input: { order_id: string } | { payment_id: string }
): Promise<string | undefined> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  if ("order_id" in input) {
    const {
      data: [orderCart],
    } = await query.graph({
      entity: "order_cart",
      fields: ["cart_id"],
      filters: { order_id: input.order_id },
    })
    return orderCart?.cart_id
  }

  const {
    data: [payment],
  } = await query.graph({
    entity: "payment",
    fields: ["id", "payment_collection.id", "payment_collection.metadata"],
    filters: { id: input.payment_id },
  })

  const collection = payment?.payment_collection as
    | { id: string; metadata?: Record<string, unknown> | null }
    | undefined

  if (!collection) {
    return undefined
  }

  const {
    data: [cartLink],
  } = await query.graph({
    entity: "cart_payment_collection",
    fields: ["cart_id"],
    filters: {
      payment_collection_id:
        (collection.metadata?.[CART_PAYMENT_COLLECTION_KEY] as
          | string
          | undefined) ?? collection.id,
    },
  })

  return cartLink?.cart_id
}

const getCartPayment = (collection?: SplitOrderGroupCollection | null) =>
  (collection?.payments ?? []).find((payment) => !payment.canceled_at)

const getOrderCollection = (
  order: SplitOrderGroupOrder,
  cartCollectionId: string
) =>
  (order.payment_collections ?? []).find(
    (collection) =>
      collection.metadata?.[CART_PAYMENT_COLLECTION_KEY] === cartCollectionId
  )

export type CartPaymentSplitPlan = {
  /** Payment collections to create, one per order that has none yet. */
  collections: {
    order_id: string
    currency_code: string
    amount: BigNumberInput
    metadata: Record<string, unknown>
  }[]
  /**
   * Payments to create. `payment_collection_id` is unset for an order whose
   * collection is created in the same run.
   */
  payments: {
    order_id: string
    payment_collection_id?: string
    provider_id: string
    currency_code: string
    amount: BigNumberInput
    data: Record<string, unknown>
  }[]
  /**
   * Captures to record. `payment_id` is unset for an order whose payment is
   * created in the same run.
   */
  captures: {
    order_id: string
    payment_id?: string
    amount: BigNumberInput
  }[]
  /**
   * Captures the orders' payments already hold. Their order transactions are
   * written again on every run, which is a no-op unless an earlier run stopped
   * between recording a capture and writing its transaction.
   */
  recorded: {
    order_id: string
    currency_code: string
    capture_id: string
    amount: BigNumberInput
  }[]
  /** What was charged for orders canceled before the capture. */
  refunds: { payment_id: string; amount: BigNumberInput; note: string }[]
  /** Set when the cart collection still has to be flagged as split. */
  cart_payment_collection?: {
    id: string
    metadata: Record<string, unknown>
  }
}

const EMPTY_PLAN: CartPaymentSplitPlan = {
  collections: [],
  payments: [],
  captures: [],
  recorded: [],
  refunds: [],
}

/**
 * Works out what is missing for every order of a cart to hold its share of
 * what the cart payment has captured. Only ever plans the difference, so a
 * cart that is already split yields an empty plan.
 */
export const planCartPaymentSplit = (
  cartCollection: SplitOrderGroupCollection | null | undefined,
  orders: SplitOrderGroupOrder[]
): CartPaymentSplitPlan => {
  const cartPayment = getCartPayment(cartCollection)

  if (!cartCollection || !cartPayment || !orders.length) {
    return EMPTY_PLAN
  }

  const captured = sum(cartPayment.captures)

  if (!MathBN.gt(captured, 0)) {
    return EMPTY_PLAN
  }

  const decimalDigits = getCurrencyDecimalDigits(cartPayment.currency_code)
  const weights = orders.map((order) => order.total)

  // What each order is entitled to of the authorization, and of the part of
  // it captured so far.
  const shares = allocateProportionally({
    amount: amountOf(cartPayment),
    weights,
    decimalDigits,
  })
  const targets = allocateProportionally({
    amount: captured,
    weights,
    decimalDigits,
  })

  const plan: CartPaymentSplitPlan = {
    collections: [],
    payments: [],
    captures: [],
    recorded: [],
    refunds: [],
  }
  let attributed = MathBN.convert(0)

  orders.forEach((order, index) => {
    const collection = getOrderCollection(order, cartCollection.id)
    const payment = collection?.payments?.[0]
    const recorded = sum(payment?.captures)
    const missing = MathBN.sub(targets[index], recorded)

    attributed = MathBN.add(attributed, recorded)

    for (const capture of payment?.captures ?? []) {
      plan.recorded.push({
        order_id: order.id,
        currency_code: cartPayment.currency_code,
        capture_id: capture.id,
        amount: amountOf(capture),
      })
    }

    // An order canceled before the capture is not paid: its part of the
    // charge stays unattributed and is refunded.
    if (isOrderCanceled(order) || !MathBN.gt(missing, 0)) {
      return
    }

    if (!collection) {
      plan.collections.push({
        order_id: order.id,
        currency_code: cartPayment.currency_code,
        amount: shares[index],
        metadata: { [CART_PAYMENT_COLLECTION_KEY]: cartCollection.id },
      })
    }

    if (!payment) {
      plan.payments.push({
        order_id: order.id,
        payment_collection_id: collection?.id,
        provider_id: cartPayment.provider_id,
        currency_code: cartPayment.currency_code,
        amount: shares[index],
        data: cartPayment.data ?? {},
      })
    }

    plan.captures.push({
      order_id: order.id,
      payment_id: payment?.id,
      amount: missing,
    })
    attributed = MathBN.add(attributed, missing)
  })

  const unattributed = MathBN.sub(
    captured,
    attributed,
    sum(cartPayment.refunds)
  )

  if (MathBN.gt(unattributed, 0)) {
    plan.refunds.push({
      payment_id: cartPayment.id,
      amount: unattributed,
      note: "Share of orders canceled before the payment was captured",
    })
  }

  if (!hasSplitOrderCollections(cartCollection)) {
    plan.cart_payment_collection = {
      id: cartCollection.id,
      metadata: {
        ...cartCollection.metadata,
        [SPLIT_ORDER_COLLECTIONS_FLAG]: true,
      },
    }
  }

  return plan
}

/** The links between the orders and the payment collections created for them. */
export const buildOrderPaymentCollectionLinks = (
  plan: CartPaymentSplitPlan,
  createdCollections: { id: string }[]
): LinkDefinition[] =>
  plan.collections.map((collection, index) => ({
    [Modules.ORDER]: { order_id: collection.order_id },
    [Modules.PAYMENT]: { payment_collection_id: createdCollections[index].id },
  }))

/**
 * The cart payment to void: set once every order of the cart is canceled and
 * nothing of the payment was captured.
 */
export const planCartPaymentVoid = (
  cartCollection: SplitOrderGroupCollection | null | undefined,
  orders: SplitOrderGroupOrder[]
): { payment_ids: string[]; payment_collection_ids: string[] } => {
  const cartPayment = getCartPayment(cartCollection)

  if (
    !cartCollection ||
    !cartPayment ||
    !orders.length ||
    isPaymentCaptured(cartPayment) ||
    !orders.every(isOrderCanceled)
  ) {
    return { payment_ids: [], payment_collection_ids: [] }
  }

  return {
    payment_ids: [cartPayment.id],
    payment_collection_ids: [cartCollection.id],
  }
}
