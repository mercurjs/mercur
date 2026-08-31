import { PolicyResource } from "../../utils/policy-resources"
import {
  ensureSellerIdParamMiddleware,
  ensureSellerMemberParamMiddleware,
} from "../../utils/ensure-seller-scope-middleware"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { PolicyOperation } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/medusa"

import * as QueryConfig from "./query-config"
import { Entities } from "./query-config"
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
    policies: [
      {
        resource: PolicyResource.seller,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/me",
    middlewares: [
      validateAndTransformBody(VendorUpdateSeller),
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
    policies: [
      {
        resource: PolicyResource.seller,
        operation: PolicyOperation.update,
      },
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
      ensureSellerIdParamMiddleware,
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.seller,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id",
    middlewares: [
      ensureSellerIdParamMiddleware,
      validateAndTransformBody(VendorUpdateSeller),
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.seller,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id/address",
    middlewares: [
      ensureSellerIdParamMiddleware,
      validateAndTransformBody(VendorUpsertSellerAddress),
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.seller,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id/payment-details",
    middlewares: [
      ensureSellerIdParamMiddleware,
      validateAndTransformBody(VendorUpsertSellerPaymentDetails),
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.seller,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id/professional-details",
    middlewares: [
      ensureSellerIdParamMiddleware,
      validateAndTransformBody(VendorUpsertSellerProfessionalDetails),
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.seller,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/sellers/:id/professional-details",
    middlewares: [
      ensureSellerIdParamMiddleware,
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.seller,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/sellers/:id/members/me",
    middlewares: [
      ensureSellerIdParamMiddleware,
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorMemberQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.seller,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/sellers/:id/members/invites",
    middlewares: [
      ensureSellerIdParamMiddleware,
      validateAndTransformQuery(
        VendorGetSellersParams,
        QueryConfig.listVendorMemberInvitesQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.seller_member,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/sellers/:id/members",
    middlewares: [
      ensureSellerIdParamMiddleware,
      validateAndTransformQuery(
        VendorGetSellersParams,
        QueryConfig.listVendorMembersQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.seller,
        operation: PolicyOperation.read,
      },
      {
        resource: Entities.seller_member,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id/members",
    middlewares: [
      ensureSellerIdParamMiddleware,
      validateAndTransformBody(VendorInviteMember),
    ],
    policies: [
      {
        resource: Entities.seller_member,
        operation: PolicyOperation.create,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id/members/:member_id",
    middlewares: [
      ensureSellerIdParamMiddleware,
      ensureSellerMemberParamMiddleware,
      validateAndTransformBody(VendorUpdateMemberRole),
    ],
    policies: [
      {
        resource: Entities.seller_member,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/sellers/:id/members/:member_id",
    middlewares: [
      ensureSellerIdParamMiddleware,
      ensureSellerMemberParamMiddleware,
    ],
    policies: [
      {
        resource: Entities.seller_member,
        operation: PolicyOperation.delete,
      },
    ],
  },
]
