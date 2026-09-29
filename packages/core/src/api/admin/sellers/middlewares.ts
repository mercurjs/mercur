import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import {
  adminSellerQueryConfig,
  adminMembersQueryConfig,
  adminMemberInvitesQueryConfig,
  adminSellerProductsQueryConfig,
} from "./query-config"
import {
  AdminGetSellerParams,
  AdminGetSellersParams,
  AdminGetSellerProductsParams,
  AdminCreateSeller,
  AdminUpdateSeller,
  AdminSuspendSeller,
  AdminTerminateSeller,
  AdminApproveSeller,
  AdminUnsuspendSeller,
  AdminUnterminateSeller,
  AdminAddSellerMember,
  AdminInviteSellerMember,
  AdminUpsertSellerAddress,
  AdminUpsertSellerPaymentDetails,
  AdminUpsertSellerProfessionalDetails,
} from "./validators"

export const adminSellersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/members/invites/:invite_id/resend",
    middlewares: [requirePermission("members.invites", "edit")],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/sellers/:id/members/invites/:invite_id",
    middlewares: [requirePermission("members.invites", "manage")],
  },
  {
    method: ["GET"],
    matcher: "/admin/sellers",
    middlewares: [
      requirePermission("sellers", "view"),
      validateAndTransformQuery(
        AdminGetSellersParams,
        adminSellerQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers",
    middlewares: [
      requirePermission("sellers", "edit"),
      validateAndTransformBody(AdminCreateSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/sellers/:id",
    middlewares: [
      requirePermission("sellers", "view"),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id",
    middlewares: [
      requirePermission("sellers", "edit"),
      validateAndTransformBody(AdminUpdateSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/suspend",
    middlewares: [
      requirePermission("sellers.approval", "edit"),
      validateAndTransformBody(AdminSuspendSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/unsuspend",
    middlewares: [
      requirePermission("sellers.approval", "edit"),
      validateAndTransformBody(AdminUnsuspendSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/approve",
    middlewares: [
      requirePermission("sellers.approval", "edit"),
      validateAndTransformBody(AdminApproveSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/terminate",
    middlewares: [
      requirePermission("sellers.approval", "edit"),
      validateAndTransformBody(AdminTerminateSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/unterminate",
    middlewares: [
      requirePermission("sellers.approval", "edit"),
      validateAndTransformBody(AdminUnterminateSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/address",
    middlewares: [
      requirePermission("sellers", "edit"),
      validateAndTransformBody(AdminUpsertSellerAddress),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/payment-details",
    middlewares: [
      requirePermission("sellers", "edit"),
      validateAndTransformBody(AdminUpsertSellerPaymentDetails),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/professional-details",
    middlewares: [
      requirePermission("sellers", "edit"),
      validateAndTransformBody(AdminUpsertSellerProfessionalDetails),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/sellers/:id/professional-details",
    middlewares: [
      requirePermission("sellers", "manage"),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/sellers/:id/members",
    middlewares: [
      requirePermission("members", "view"),
      validateAndTransformQuery(
        AdminGetSellersParams,
        adminMembersQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/sellers/:id/products",
    middlewares: [
      requirePermission("products", "view"),
      validateAndTransformQuery(
        AdminGetSellerProductsParams,
        adminSellerProductsQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/members",
    middlewares: [
      requirePermission("members", "edit"),
      validateAndTransformBody(AdminAddSellerMember),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/sellers/:id/members/invites",
    middlewares: [
      requirePermission("members.invites", "view"),
      validateAndTransformQuery(
        AdminGetSellersParams,
        adminMemberInvitesQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/members/invite",
    middlewares: [
      requirePermission("members.invites", "edit"),
      validateAndTransformBody(AdminInviteSellerMember),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/sellers/:id/members/:member_id",
    middlewares: [
      requirePermission("members", "manage"),
    ],
  },
]
