import { BigNumberInput, MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  OrderStatus,
} from "@medusajs/framework/utils"

import { SPLIT_ORDER_PAYMENT_PROVIDER_ID } from "../../../providers/payment-split-order/constants"

/** Set on a cart's payment collection once its orders have their own. */
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
  payment_collection_id: string
  currency_code: string
  amount: BigNumberInput
  raw_amount?: BigNumberInput | null
  data?: Record<string, unknown> | null
  captured_at?: Date | string | null
  canceled_at?: Date | string | null
  captures: PaymentMovement[]
  refunds: PaymentMovement[]
}

export type SplitOrderGroupOrder = {
  id: string
  status: string
  canceled_at?: Date | string | null
  total: BigNumberInput
  /** The order's share of the cart payment, once created. */
  payment?: SplitOrderGroupPayment
}

export type SplitOrderPaymentGroup = {
  cart_id: string
  payment_collection: {
    id: string
    currency_code: string
    metadata?: Record<string, unknown> | null
  }
  /** The payment the customer made for the cart, at the real provider. */
  payment?: SplitOrderGroupPayment
  orders: SplitOrderGroupOrder[]
}

export type SplitOrderPaymentGroupInput =
  | { cart_id: string }
  | { order_id: string }
  | { payment_id: string }

type PaymentCollectionSnapshot = SplitOrderPaymentGroup["payment_collection"] & {
  payments?: SplitOrderGroupPayment[]
}

const PAYMENT_FIELDS = [
  "id",
  "provider_id",
  "payment_collection_id",
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

export const isPaymentCaptured = (payment: SplitOrderGroupPayment) =>
  !!payment.captured_at || payment.captures.length > 0

export const isOrderCanceled = (order: {
  status: string
  canceled_at?: Date | string | null
}) => order.status === OrderStatus.CANCELED || !!order.canceled_at

export const hasSplitOrderCollections = (
  paymentCollection?: { metadata?: Record<string, unknown> | null } | null
) => paymentCollection?.metadata?.[SPLIT_ORDER_COLLECTIONS_FLAG] === true

/**
 * The payment collections that pay for an order: its own, or the cart's shared
 * one for an order placed before every split order had its own.
 */
export const resolveOrderPaymentCollections = (order: {
  cart?: {
    payment_collection?: { metadata?: Record<string, unknown> | null } | null
  } | null
  payment_collections?: unknown[]
}): unknown[] => {
  const cartPaymentCollection = order.cart?.payment_collection

  if (cartPaymentCollection && !hasSplitOrderCollections(cartPaymentCollection)) {
    return [cartPaymentCollection]
  }

  return order.payment_collections ?? []
}

const resolveCartId = async (
  container: MedusaContainer,
  input: SplitOrderPaymentGroupInput
): Promise<string | undefined> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  if ("cart_id" in input) {
    return input.cart_id
  }

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

  const cartCollectionId =
    (collection.metadata?.[CART_PAYMENT_COLLECTION_KEY] as string | undefined) ??
    collection.id

  const {
    data: [cartLink],
  } = await query.graph({
    entity: "cart_payment_collection",
    fields: ["cart_id"],
    filters: { payment_collection_id: cartCollectionId },
  })

  return cartLink?.cart_id
}

/**
 * The cart payment together with the orders it pays for and each order's
 * share. Resolves to `undefined` when the input is not tied to a cart that has
 * a payment collection.
 */
export const loadSplitOrderPaymentGroup = async (
  container: MedusaContainer,
  input: SplitOrderPaymentGroupInput
): Promise<SplitOrderPaymentGroup | undefined> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const cartId = await resolveCartId(container, input)
  if (!cartId) {
    return undefined
  }

  const [
    {
      data: [cartLink],
    },
    { data: orderCarts },
  ] = await Promise.all([
    query.graph({
      entity: "cart_payment_collection",
      fields: ["payment_collection_id"],
      filters: { cart_id: cartId },
    }),
    query.graph({
      entity: "order_cart",
      fields: ["order_id"],
      filters: { cart_id: cartId },
    }),
  ])

  if (!cartLink?.payment_collection_id) {
    return undefined
  }

  const orderIds = orderCarts.map((link) => link.order_id as string)

  const [
    {
      data: [cartCollection],
    },
    { data: orders },
  ] = await Promise.all([
    query.graph({
      entity: "payment_collection",
      fields: COLLECTION_FIELDS,
      filters: { id: cartLink.payment_collection_id },
    }),
    orderIds.length
      ? query.graph({
          entity: "order",
          fields: [
            "id",
            "status",
            "canceled_at",
            "total",
            ...COLLECTION_FIELDS.map((field) => `payment_collections.${field}`),
          ],
          filters: { id: orderIds },
        })
      : Promise.resolve({ data: [] }),
  ])

  const collection = cartCollection as unknown as PaymentCollectionSnapshot

  return {
    cart_id: cartId,
    payment_collection: {
      id: collection.id,
      currency_code: collection.currency_code,
      metadata: collection.metadata,
    },
    payment: (collection.payments ?? []).find(
      (payment) =>
        !payment.canceled_at &&
        payment.provider_id !== SPLIT_ORDER_PAYMENT_PROVIDER_ID
    ),
    orders: orders.map((order) => {
      const collections = (order.payment_collections ??
        []) as unknown as PaymentCollectionSnapshot[]
      const share = collections.find(
        (c) => c.metadata?.[CART_PAYMENT_COLLECTION_KEY] === collection.id
      )

      return {
        id: order.id,
        status: order.status,
        canceled_at: order.canceled_at,
        total: order.total,
        payment: share?.payments?.[0],
      }
    }),
  }
}
