import { requirePermission } from "../../utils"
import {
  ensureSellerIdParamMiddleware,
  ensureSellerMemberParamMiddleware,
} from "../../utils/ensure-seller-scope-middleware"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import * as QueryConfig from "./query-config"
import {
  VendorCreateSellerAccount,
  VendorGetSellerParams,
  VendorGetSellersParams,
  VendorInviteMember,
  VendorSelectSeller,
  VendorUpdateMemberRole,
  VendorUpdateSeller,
  VendorUpsertSellerAddress,
  VendorUpsertSellerPaymentDetails,
  VendorUpsertSellerProfessionalDetails,
} from "./validators"

export const vendorSellersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/vendor/sellers/select",
    middlewares: [
      validateAndTransformBody(VendorSelectSeller),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/sellers/me",
    middlewares: [
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/me",
    middlewares: [
      requirePermission("store", "edit"),
      validateAndTransformBody(VendorUpdateSeller),
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers",
    middlewares: [
      validateAndTransformBody(VendorCreateSellerAccount),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/sellers",
    middlewares: [
      validateAndTransformQuery(
        VendorGetSellersParams,
        QueryConfig.listVendorSellersQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/sellers/:id",
    middlewares: [
      requirePermission("store", "view"),
      ensureSellerIdParamMiddleware,
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id",
    middlewares: [
      requirePermission("store", "edit"),
      ensureSellerIdParamMiddleware,
      validateAndTransformBody(VendorUpdateSeller),
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id/address",
    middlewares: [
      requirePermission("store", "edit"),
      ensureSellerIdParamMiddleware,
      validateAndTransformBody(VendorUpsertSellerAddress),
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id/payment-details",
    middlewares: [
      requirePermission("store", "edit"),
      ensureSellerIdParamMiddleware,
      validateAndTransformBody(VendorUpsertSellerPaymentDetails),
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id/professional-details",
    middlewares: [
      requirePermission("store", "edit"),
      ensureSellerIdParamMiddleware,
      validateAndTransformBody(VendorUpsertSellerProfessionalDetails),
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/sellers/:id/professional-details",
    middlewares: [
      requirePermission("store", "edit"),
      ensureSellerIdParamMiddleware,
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/sellers/:id/members/me",
    middlewares: [
      requirePermission("store", "view"),
      ensureSellerIdParamMiddleware,
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorMemberQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/sellers/:id/members/invites",
    middlewares: [
      requirePermission("members", "view"),
      ensureSellerIdParamMiddleware,
      validateAndTransformQuery(
        VendorGetSellersParams,
        QueryConfig.listVendorMemberInvitesQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/sellers/:id/members",
    middlewares: [
      requirePermission("store", "view"),
      requirePermission("members", "view"),
      ensureSellerIdParamMiddleware,
      validateAndTransformQuery(
        VendorGetSellersParams,
        QueryConfig.listVendorMembersQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id/members",
    middlewares: [
      requirePermission("members", "edit"),
      ensureSellerIdParamMiddleware,
      validateAndTransformBody(VendorInviteMember),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id/members/:member_id",
    middlewares: [
      requirePermission("members", "edit"),
      ensureSellerIdParamMiddleware,
      ensureSellerMemberParamMiddleware,
      validateAndTransformBody(VendorUpdateMemberRole),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/sellers/:id/members/:member_id",
    middlewares: [
      requirePermission("members", "manage"),
      ensureSellerIdParamMiddleware,
      ensureSellerMemberParamMiddleware,
    ],
  },
]
