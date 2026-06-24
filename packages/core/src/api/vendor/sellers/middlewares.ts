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
    middlewares: [],
    policies: [
      {
        resource: Entities.seller_member,
        operation: PolicyOperation.delete,
      },
    ],
  },
]
