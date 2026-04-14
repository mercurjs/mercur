import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { adminSellerQueryConfig, adminMembersQueryConfig, adminMemberInvitesQueryConfig } from "./query-config"
import {
  AdminGetSellerParams,
  AdminGetSellersParams,
  AdminCreateSeller,
  AdminUpdateSeller,
  AdminSuspendSeller,
  AdminTerminateSeller,
  AdminAddSellerMember,
  AdminInviteSellerMember,
  AdminUpsertSellerAddress,
  AdminUpsertSellerPaymentDetails,
  AdminUpsertSellerProfessionalDetails,
} from "./validators"

export const adminSellersMiddlewares: MiddlewareRoute[] = [
  // GET /admin/sellers — list all sellers
  {
    method: ["GET"],
    matcher: "/admin/sellers",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellersParams,
        adminSellerQueryConfig.list
      ),
    ],
  },
  // POST /admin/sellers — create seller
  {
    method: ["POST"],
    matcher: "/admin/sellers",
    middlewares: [
      validateAndTransformBody(AdminCreateSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  // GET /admin/sellers/:id — get seller detail
  {
    method: ["GET"],
    matcher: "/admin/sellers/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  // POST /admin/sellers/:id — update seller
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  // POST /admin/sellers/:id/suspend — suspend seller
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/suspend",
    middlewares: [
      validateAndTransformBody(AdminSuspendSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  // POST /admin/sellers/:id/unsuspend — lift suspension
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/unsuspend",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  // POST /admin/sellers/:id/approve — approve pending seller
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/approve",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  // POST /admin/sellers/:id/terminate — terminate seller
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/terminate",
    middlewares: [
      validateAndTransformBody(AdminTerminateSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  // POST /admin/sellers/:id/unterminate — reactivate terminated seller
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/unterminate",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  // POST /admin/sellers/:id/address — upsert seller address
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/address",
    middlewares: [
      validateAndTransformBody(AdminUpsertSellerAddress),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  // POST /admin/sellers/:id/payment-details — upsert seller payment details
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/payment-details",
    middlewares: [
      validateAndTransformBody(AdminUpsertSellerPaymentDetails),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  // POST /admin/sellers/:id/professional-details — upsert seller professional details
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/professional-details",
    middlewares: [
      validateAndTransformBody(AdminUpsertSellerProfessionalDetails),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  // DELETE /admin/sellers/:id/professional-details — remove professional status
  {
    method: ["DELETE"],
    matcher: "/admin/sellers/:id/professional-details",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  // GET /admin/sellers/:id/members — list members
  {
    method: ["GET"],
    matcher: "/admin/sellers/:id/members",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellersParams,
        adminMembersQueryConfig.list
      ),
    ],
  },
  // POST /admin/sellers/:id/members — direct add member
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/members",
    middlewares: [
      validateAndTransformBody(AdminAddSellerMember),
    ],
  },
  // GET /admin/sellers/:id/members/invites — list invites
  {
    method: ["GET"],
    matcher: "/admin/sellers/:id/members/invites",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellersParams,
        adminMemberInvitesQueryConfig.list
      ),
    ],
  },
  // POST /admin/sellers/:id/members/invite — invite by email
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/members/invite",
    middlewares: [
      validateAndTransformBody(AdminInviteSellerMember),
    ],
  },
  // DELETE /admin/sellers/:id/members/:member_id — remove member
  {
    method: ["DELETE"],
    matcher: "/admin/sellers/:id/members/:member_id",
    middlewares: [],
  },
]
