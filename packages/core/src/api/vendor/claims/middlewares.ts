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
import { vendorClaimQueryConfig } from "./query-config"
import { validateSellerClaim } from "./helpers"
import {
  VendorGetClaimParams,
  VendorGetClaimsParams,
  VendorPostCancelClaimReq,
  VendorPostClaimItemsReq,
  VendorPostClaimsAddItemsActionReq,
  VendorPostClaimsAddItemsReq,
  VendorPostClaimsItemsActionReq,
  VendorPostClaimsRequestItemsReturnActionReq,
  VendorPostClaimsRequestReturnItemsReq,
  VendorPostClaimsShippingActionReq,
  VendorPostClaimsShippingReq,
  VendorPostOrderClaimsReq,
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

const assertSellerOwnsClaimInParam = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const sellerId = req.seller_context!.seller_id
  const { id } = req.params
  await validateSellerClaim(req.scope, sellerId, id)
  return next()
}

const applySellerClaimsFilter = async (
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

export const vendorClaimsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/claims",
    middlewares: [
      validateAndTransformQuery(
        VendorGetClaimsParams,
        vendorClaimQueryConfig.list
      ),
      applySellerClaimsFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/claims",
    middlewares: [
      validateAndTransformBody(VendorPostOrderClaimsReq),
      assertSellerOwnsOrderInBody,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/claims/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetClaimParams,
        vendorClaimQueryConfig.retrieve
      ),
      assertSellerOwnsClaimInParam,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/claims/:id/cancel",
    middlewares: [
      validateAndTransformBody(VendorPostCancelClaimReq),
      assertSellerOwnsClaimInParam,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/claims/:id/request",
    middlewares: [assertSellerOwnsClaimInParam],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/claims/:id/request",
    middlewares: [assertSellerOwnsClaimInParam],
  },
  {
    method: ["POST"],
    matcher: "/vendor/claims/:id/claim-items",
    middlewares: [
      validateAndTransformBody(VendorPostClaimItemsReq),
      assertSellerOwnsClaimInParam,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/claims/:id/claim-items/:action_id",
    middlewares: [
      validateAndTransformBody(VendorPostClaimsItemsActionReq),
      assertSellerOwnsClaimInParam,
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/claims/:id/claim-items/:action_id",
    middlewares: [assertSellerOwnsClaimInParam],
  },
  {
    method: ["POST"],
    matcher: "/vendor/claims/:id/inbound/items",
    middlewares: [
      validateAndTransformBody(VendorPostClaimsRequestReturnItemsReq),
      assertSellerOwnsClaimInParam,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/claims/:id/inbound/items/:action_id",
    middlewares: [
      validateAndTransformBody(VendorPostClaimsRequestItemsReturnActionReq),
      assertSellerOwnsClaimInParam,
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/claims/:id/inbound/items/:action_id",
    middlewares: [assertSellerOwnsClaimInParam],
  },
  {
    method: ["POST"],
    matcher: "/vendor/claims/:id/inbound/shipping-method",
    middlewares: [
      validateAndTransformBody(VendorPostClaimsShippingReq),
      assertSellerOwnsClaimInParam,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/claims/:id/inbound/shipping-method/:action_id",
    middlewares: [
      validateAndTransformBody(VendorPostClaimsShippingActionReq),
      assertSellerOwnsClaimInParam,
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/claims/:id/inbound/shipping-method/:action_id",
    middlewares: [assertSellerOwnsClaimInParam],
  },
  {
    method: ["POST"],
    matcher: "/vendor/claims/:id/outbound/items",
    middlewares: [
      validateAndTransformBody(VendorPostClaimsAddItemsReq),
      assertSellerOwnsClaimInParam,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/claims/:id/outbound/items/:action_id",
    middlewares: [
      validateAndTransformBody(VendorPostClaimsAddItemsActionReq),
      assertSellerOwnsClaimInParam,
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/claims/:id/outbound/items/:action_id",
    middlewares: [assertSellerOwnsClaimInParam],
  },
  {
    method: ["POST"],
    matcher: "/vendor/claims/:id/outbound/shipping-method",
    middlewares: [
      validateAndTransformBody(VendorPostClaimsShippingReq),
      assertSellerOwnsClaimInParam,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/claims/:id/outbound/shipping-method/:action_id",
    middlewares: [
      validateAndTransformBody(VendorPostClaimsShippingActionReq),
      assertSellerOwnsClaimInParam,
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/claims/:id/outbound/shipping-method/:action_id",
    middlewares: [assertSellerOwnsClaimInParam],
  },
]
