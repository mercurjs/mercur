import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { OrderDetailDTO } from "@medusajs/framework/types"
import { deduplicate } from "@medusajs/framework/utils"

import { getLastPaymentStatus } from "../../workflows/order-group/utils/aggregate-status"

type OrderWithCartPaymentCollection = {
  cart?: { payment_collection?: unknown } | null
  payment_collections?: unknown[]
  payment_status?: string
}

// The shared cart payment collection is reached through the cart, not linked
// to the order. These fields must always be loaded so the routes can normalize
// them back onto `payment_collections` and recompute `payment_status` — even
// when the client sends an absolute `fields=` list that would otherwise replace
// the route defaults.
const CART_PAYMENT_COLLECTION_FIELDS = [
  "cart.payment_collection.*",
  "cart.payment_collection.payments.*",
  "cart.payment_collection.payments.refunds.*",
  "cart.payment_collection.payments.refunds.refund_reason.*",
  "cart.payment_collection.payment_sessions.*",
]

export const withCartPaymentCollectionFields = (fields: string[]): string[] => {
  return deduplicate([...fields, ...CART_PAYMENT_COLLECTION_FIELDS])
}

// The shared cart payment collection is fetched via `cart.payment_collection`
// (it is not linked directly to an order). Expose it back on the order under
// `payment_collections` so consumers keep the familiar shape, and recompute
// `payment_status` from it — Medusa's aggregation reads the linked payment
// collections, which are always empty for split orders under the cart-path model.
export const normalizeOrderPaymentCollections = <
  T extends OrderWithCartPaymentCollection
>(
  order: T,
  { keepCart = false }: { keepCart?: boolean } = {}
): T => {
  const paymentCollection = order.cart?.payment_collection

  if (!keepCart) {
    delete order.cart
  }

  if (!paymentCollection) {
    return order
  }

  order.payment_collections = [paymentCollection]
  order.payment_status = getLastPaymentStatus(
    order as unknown as OrderDetailDTO
  )

  return order
}

const isOrderLike = (value: unknown): value is OrderWithCartPaymentCollection =>
  !!value && typeof value === "object"

// `/admin/orders(/:id)` and `/store/orders(/:id)` are stock Medusa routes, so
// the cart-path normalization has to be applied around them: request the cart
// payment collection fields, then rewrite the response before it is sent.
export const normalizeSplitOrderPaymentStatus = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const requestedFields: string[] = req.queryConfig?.fields ?? []
  const clientRequestedCart = requestedFields.some(
    (field) => field === "cart" || field.startsWith("cart.")
  )

  if (req.queryConfig) {
    req.queryConfig.fields = withCartPaymentCollectionFields(requestedFields)
  }

  const json = res.json.bind(res)

  res.json = ((body: unknown) => {
    if (body && typeof body === "object") {
      const payload = body as { order?: unknown; orders?: unknown }

      if (isOrderLike(payload.order)) {
        normalizeOrderPaymentCollections(payload.order, {
          keepCart: clientRequestedCart,
        })
      }

      if (Array.isArray(payload.orders)) {
        payload.orders.filter(isOrderLike).forEach((order) => {
          normalizeOrderPaymentCollections(order, {
            keepCart: clientRequestedCart,
          })
        })
      }
    }

    return json(body as never)
  }) as typeof res.json

  return next()
}
