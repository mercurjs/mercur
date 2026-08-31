import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
      validateAndTransformBody(VendorPostOrderEditsReq),
      assertSellerOwnsOrderInBody,
    ],
    policies: [
      {
        resource: PolicyResource.order_change,
        operation: PolicyOperation.create,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/order-edits/:id",
    middlewares: [assertSellerOwnsOrderInParam],
    policies: [
      {
        resource: PolicyResource.order_change,
        operation: PolicyOperation.delete,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/request",
    middlewares: [assertSellerOwnsOrderInParam],
    policies: [
      {
        resource: PolicyResource.order_change,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/confirm",
    middlewares: [assertSellerOwnsOrderInParam],
    policies: [
      {
        resource: PolicyResource.order_change,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/items",
    middlewares: [
      validateAndTransformBody(VendorPostOrderEditsAddItemsReq),
      assertSellerOwnsOrderInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_change,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/items/:action_id",
    middlewares: [
      validateAndTransformBody(VendorPostOrderEditsItemsActionReq),
      assertSellerOwnsOrderInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_change,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/order-edits/:id/items/:action_id",
    middlewares: [assertSellerOwnsOrderInParam],
    policies: [
      {
        resource: PolicyResource.order_change,
        operation: PolicyOperation.delete,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/items/item/:item_id",
    middlewares: [
      validateAndTransformBody(VendorPostOrderEditsUpdateItemQuantityReq),
      assertSellerOwnsOrderInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_change,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/shipping-method",
    middlewares: [
      validateAndTransformBody(VendorPostOrderEditsShippingReq),
      assertSellerOwnsOrderInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_change,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/order-edits/:id/shipping-method/:action_id",
    middlewares: [
      validateAndTransformBody(VendorPostOrderEditsShippingActionReq),
      assertSellerOwnsOrderInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_change,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/order-edits/:id/shipping-method/:action_id",
    middlewares: [assertSellerOwnsOrderInParam],
    policies: [
      {
        resource: PolicyResource.order_change,
        operation: PolicyOperation.delete,
      },
    ],
  },
]
