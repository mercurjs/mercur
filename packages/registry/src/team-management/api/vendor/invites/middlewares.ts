import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"

import { vendorMemberInviteQueryConfig } from "./query-config"
import {
  VendorAcceptMemberInvite,
  VendorGetMemberInviteParams,
  VendorInviteMember,
} from "./validators"

const applySellerInviteFilter = (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id
  next()
}

export const vendorInvitesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/invites",
    middlewares: [
      validateAndTransformQuery(
        VendorGetMemberInviteParams,
        vendorMemberInviteQueryConfig.list
      ),
      applySellerInviteFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/invites",
    middlewares: [
      validateAndTransformBody(VendorInviteMember),
      validateAndTransformQuery(
        VendorGetMemberInviteParams,
        vendorMemberInviteQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/invites/accept",
    middlewares: [
      validateAndTransformBody(VendorAcceptMemberInvite),
      validateAndTransformQuery(
        VendorGetMemberInviteParams,
        vendorMemberInviteQueryConfig.retrieve
      ),
    ],
  },
]
