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
  VendorUpdateMemberRole,
  VendorUpdateSeller,
  VendorUpsertSellerAddress,
  VendorUpsertSellerPaymentDetails,
  VendorUpsertSellerProfessionalDetails,
} from "./validators"

export const vendorSellersMiddlewares: MiddlewareRoute[] = [
  // POST /vendor/sellers — create seller
  {
    method: ["POST"],
    matcher: "/vendor/sellers",
    middlewares: [
      validateAndTransformBody(VendorCreateSellerAccount),
    ],
  },
  // GET /vendor/sellers — list member's sellers (store switcher)
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
  // GET /vendor/sellers/:id — get seller detail
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
  // POST /vendor/sellers/:id — update seller
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
  // POST /vendor/sellers/:id/address — upsert seller address
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
  // POST /vendor/sellers/:id/payment-details — upsert seller payment details
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
  // POST /vendor/sellers/:id/professional-details — upsert seller professional details
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
  // DELETE /vendor/sellers/:id/professional-details — remove professional status
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
  // GET /vendor/sellers/:id/members — list members
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
  // POST /vendor/sellers/:id/members — invite member
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
  // POST /vendor/sellers/:id/members/:member_id — update member role
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
  // DELETE /vendor/sellers/:id/members/:member_id — remove member
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
