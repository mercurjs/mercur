import { requirePermission } from "../../utils"
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
      requirePermission("orders.edits", "edit"),
      validateAndTransformBody(VendorPostOrderEditsReq),
      assertSellerOwnsOrderInBody,
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/order-edits/:id",
    middlewares: [
      requirePermission("orders.edits", "manage"),
      assertSellerOwnsOrderInParam],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/request",
    middlewares: [
      requirePermission("orders.edits", "edit"),
      assertSellerOwnsOrderInParam],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/confirm",
    middlewares: [
      requirePermission("orders.edits", "edit"),
      assertSellerOwnsOrderInParam],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/items",
    middlewares: [
      requirePermission("orders.edits", "edit"),
      validateAndTransformBody(VendorPostOrderEditsAddItemsReq),
      assertSellerOwnsOrderInParam,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/items/:action_id",
    middlewares: [
      requirePermission("orders.edits", "edit"),
      validateAndTransformBody(VendorPostOrderEditsItemsActionReq),
      assertSellerOwnsOrderInParam,
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/order-edits/:id/items/:action_id",
    middlewares: [
      requirePermission("orders.edits", "manage"),
      assertSellerOwnsOrderInParam],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/items/item/:item_id",
    middlewares: [
      requirePermission("orders.edits", "edit"),
      validateAndTransformBody(VendorPostOrderEditsUpdateItemQuantityReq),
      assertSellerOwnsOrderInParam,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/shipping-method",
    middlewares: [
      requirePermission("orders.edits", "edit"),
      validateAndTransformBody(VendorPostOrderEditsShippingReq),
      assertSellerOwnsOrderInParam,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/shipping-method/:action_id",
    middlewares: [
      requirePermission("orders.edits", "edit"),
      validateAndTransformBody(VendorPostOrderEditsShippingActionReq),
      assertSellerOwnsOrderInParam,
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/order-edits/:id/shipping-method/:action_id",
    middlewares: [
      requirePermission("orders.edits", "manage"),
      assertSellerOwnsOrderInParam],
  },
]
