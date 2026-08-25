import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
    method: ["GET"],
    matcher: "/admin/sellers",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellersParams,
        adminSellerQueryConfig.list
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
    matcher: "/admin/sellers",
    middlewares: [
      validateAndTransformBody(AdminCreateSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.seller,
        operation: PolicyOperation.create,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/sellers/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
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
    matcher: "/admin/sellers/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
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
    matcher: "/admin/sellers/:id/suspend",
    middlewares: [
      validateAndTransformBody(AdminSuspendSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
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
    matcher: "/admin/sellers/:id/unsuspend",
    middlewares: [
      validateAndTransformBody(AdminUnsuspendSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
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
    matcher: "/admin/sellers/:id/approve",
    middlewares: [
      validateAndTransformBody(AdminApproveSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
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
    matcher: "/admin/sellers/:id/terminate",
    middlewares: [
      validateAndTransformBody(AdminTerminateSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
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
    matcher: "/admin/sellers/:id/unterminate",
    middlewares: [
      validateAndTransformBody(AdminUnterminateSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
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
    matcher: "/admin/sellers/:id/address",
    middlewares: [
      validateAndTransformBody(AdminUpsertSellerAddress),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
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
    matcher: "/admin/sellers/:id/payment-details",
    middlewares: [
      validateAndTransformBody(AdminUpsertSellerPaymentDetails),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
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
    matcher: "/admin/sellers/:id/professional-details",
    middlewares: [
      validateAndTransformBody(AdminUpsertSellerProfessionalDetails),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
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
    method: ["DELETE"],
    matcher: "/admin/sellers/:id/professional-details",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.seller,
        operation: PolicyOperation.delete,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/sellers/:id/members",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellersParams,
        adminMembersQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.seller_member,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/sellers/:id/products",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellerProductsParams,
        adminSellerProductsQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/members",
    middlewares: [
      validateAndTransformBody(AdminAddSellerMember),
    ],
    policies: [
      {
        resource: PolicyResource.seller_member,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/sellers/:id/members/invites",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellersParams,
        adminMemberInvitesQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.member_invite,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id/members/invite",
    middlewares: [
      validateAndTransformBody(AdminInviteSellerMember),
    ],
    policies: [
      {
        resource: PolicyResource.member_invite,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/sellers/:id/members/:member_id",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.seller_member,
        operation: PolicyOperation.delete,
      },
    ],
  },
]
