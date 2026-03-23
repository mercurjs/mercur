import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import * as QueryConfig from "./query-config"
import {
  VendorCreateSeller,
  VendorGetSellerParams,
  VendorGetSellersParams,
  VendorInviteMember,
  VendorUpdateMemberRole,
  VendorUpdateSeller,
} from "./validators"

export const vendorSellersMiddlewares: MiddlewareRoute[] = [
  // POST /vendor/sellers — create seller
  {
    method: ["POST"],
    matcher: "/vendor/sellers",
    middlewares: [
      validateAndTransformBody(VendorCreateSeller),
      validateAndTransformQuery(
        VendorGetSellerParams,
        QueryConfig.retrieveVendorSellerQueryConfig
      ),
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
  },
  // POST /vendor/sellers/:id/members — invite member
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id/members",
    middlewares: [
      validateAndTransformBody(VendorInviteMember),
    ],
  },
  // POST /vendor/sellers/:id/members/:member_id — update member role
  {
    method: ["POST"],
    matcher: "/vendor/sellers/:id/members/:member_id",
    middlewares: [
      validateAndTransformBody(VendorUpdateMemberRole),
    ],
  },
  // DELETE /vendor/sellers/:id/members/:member_id — remove member
  {
    method: ["DELETE"],
    matcher: "/vendor/sellers/:id/members/:member_id",
    middlewares: [],
  },
]
