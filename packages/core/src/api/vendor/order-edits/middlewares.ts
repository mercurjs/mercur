import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformBody } from "@medusajs/framework"

import { validateSellerOrder } from "../orders/helpers"
import {
  VendorPostOrderEditsAddItemsReq,
  VendorPostOrderEditsItemsActionReq,
  VendorPostOrderEditsReq,
  VendorPostOrderEditsShippingActionReq,
  VendorPostOrderEditsShippingReq,
  VendorPostOrderEditsUpdateItemQuantityReq,
} from "./validators"

/**
 * Seller-scope guard for `POST /vendor/order-edits`. Body carries
 * `order_id`; we assert the authenticated seller owns it.
 */
const assertSellerOwnsOrderInBody = async (
  req: AuthenticatedMedusaRequest<{ order_id: string }>,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const sellerId = req.seller_context!.seller_id
  const orderId = req.validatedBody!.order_id
  await validateSellerOrder(req.scope, sellerId, orderId)
  return next()
}

/**
 * Seller-scope guard for `:id`-keyed routes. Per Medusa admin's
 * convention (mirrored from `/admin/order-edits/:id/*`) `:id` is the
 * **order_id** — the workflows (`cancelBeginOrderEditWorkflow`,
 * `requestOrderEditRequestWorkflow`, `confirmOrderEditRequestWorkflow`)
 * all take `order_id` as input, not an order_change id. So we just
 * defer to the canonical seller-scope check on the order.
 */
const assertSellerOwnsOrderInParam = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const sellerId = req.seller_context!.seller_id
  const { id } = req.params
  await validateSellerOrder(req.scope, sellerId, id)
  return next()
}

export const vendorOrderEditsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/vendor/order-edits",
    middlewares: [
      validateAndTransformBody(VendorPostOrderEditsReq),
      assertSellerOwnsOrderInBody,
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/order-edits/:id",
    middlewares: [assertSellerOwnsOrderInParam],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/request",
    middlewares: [assertSellerOwnsOrderInParam],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/confirm",
    middlewares: [assertSellerOwnsOrderInParam],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/items",
    middlewares: [
      validateAndTransformBody(VendorPostOrderEditsAddItemsReq),
      assertSellerOwnsOrderInParam,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/items/:action_id",
    middlewares: [
      validateAndTransformBody(VendorPostOrderEditsItemsActionReq),
      assertSellerOwnsOrderInParam,
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/order-edits/:id/items/:action_id",
    middlewares: [assertSellerOwnsOrderInParam],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/items/item/:item_id",
    middlewares: [
      validateAndTransformBody(VendorPostOrderEditsUpdateItemQuantityReq),
      assertSellerOwnsOrderInParam,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/shipping-method",
    middlewares: [
      validateAndTransformBody(VendorPostOrderEditsShippingReq),
      assertSellerOwnsOrderInParam,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/shipping-method/:action_id",
    middlewares: [
      validateAndTransformBody(VendorPostOrderEditsShippingActionReq),
      assertSellerOwnsOrderInParam,
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/order-edits/:id/shipping-method/:action_id",
    middlewares: [assertSellerOwnsOrderInParam],
  },
]
