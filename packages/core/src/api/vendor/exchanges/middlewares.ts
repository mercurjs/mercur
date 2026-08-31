import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { validateSellerOrder } from "../orders/helpers"
import { vendorExchangeQueryConfig } from "./query-config"
import { validateSellerExchange } from "./helpers"
import {
  VendorGetExchangesParams,
  VendorPostCancelExchangeReq,
  VendorPostExchangesAddItemsReq,
  VendorPostExchangesItemsActionReq,
  VendorPostExchangesRequestItemsReturnActionReq,
  VendorPostExchangesReturnRequestItemsReq,
  VendorPostExchangesShippingActionReq,
  VendorPostExchangesShippingReq,
  VendorPostOrderExchangesReq,
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

const assertSellerOwnsExchangeInParam = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const sellerId = req.seller_context!.seller_id
  const { id } = req.params
  await validateSellerExchange(req.scope, sellerId, id)
  return next()
}

const applySellerExchangesFilter = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (req.filterableFields.order_id) {
    await validateSellerOrder(
      req.scope,
      req.seller_context!.seller_id,
      req.filterableFields.order_id as string | string[]
    )
    return next()
  }

  req.filterableFields.seller_id = req.seller_context!.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "order_seller",
    resourceId: "order_id",
    filterableField: "seller_id",
    filterByField: "order_id",
  })(req, res, next)
}

export const vendorExchangesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/exchanges",
    middlewares: [
      validateAndTransformQuery(
        VendorGetExchangesParams,
        vendorExchangeQueryConfig.list
      ),
      applySellerExchangesFilter,
    ],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/exchanges",
    middlewares: [
      validateAndTransformBody(VendorPostOrderExchangesReq),
      assertSellerOwnsOrderInBody,
    ],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.create,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/exchanges/:id/cancel",
    middlewares: [
      validateAndTransformBody(VendorPostCancelExchangeReq),
      assertSellerOwnsExchangeInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/exchanges/:id/request",
    middlewares: [assertSellerOwnsExchangeInParam],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/exchanges/:id/request",
    middlewares: [assertSellerOwnsExchangeInParam],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.delete,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/exchanges/:id/inbound/items",
    middlewares: [
      validateAndTransformBody(VendorPostExchangesReturnRequestItemsReq),
      assertSellerOwnsExchangeInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/exchanges/:id/inbound/items/:action_id",
    middlewares: [
      validateAndTransformBody(VendorPostExchangesRequestItemsReturnActionReq),
      assertSellerOwnsExchangeInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/exchanges/:id/inbound/items/:action_id",
    middlewares: [assertSellerOwnsExchangeInParam],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.delete,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/exchanges/:id/inbound/shipping-method",
    middlewares: [
      validateAndTransformBody(VendorPostExchangesShippingReq),
      assertSellerOwnsExchangeInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/exchanges/:id/inbound/shipping-method/:action_id",
    middlewares: [
      validateAndTransformBody(VendorPostExchangesShippingActionReq),
      assertSellerOwnsExchangeInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/exchanges/:id/inbound/shipping-method/:action_id",
    middlewares: [assertSellerOwnsExchangeInParam],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.delete,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/exchanges/:id/outbound/items",
    middlewares: [
      validateAndTransformBody(VendorPostExchangesAddItemsReq),
      assertSellerOwnsExchangeInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/exchanges/:id/outbound/items/:action_id",
    middlewares: [
      validateAndTransformBody(VendorPostExchangesItemsActionReq),
      assertSellerOwnsExchangeInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/exchanges/:id/outbound/items/:action_id",
    middlewares: [assertSellerOwnsExchangeInParam],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.delete,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/exchanges/:id/outbound/shipping-method",
    middlewares: [
      validateAndTransformBody(VendorPostExchangesShippingReq),
      assertSellerOwnsExchangeInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/exchanges/:id/outbound/shipping-method/:action_id",
    middlewares: [
      validateAndTransformBody(VendorPostExchangesShippingActionReq),
      assertSellerOwnsExchangeInParam,
    ],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/exchanges/:id/outbound/shipping-method/:action_id",
    middlewares: [assertSellerOwnsExchangeInParam],
    policies: [
      {
        resource: PolicyResource.order_exchange,
        operation: PolicyOperation.delete,
      },
    ],
  },
]
