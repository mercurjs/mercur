import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"

import sellerMemberInvite from "../../../links/seller-member-invite"
import { vendorMemberInviteQueryConfig } from "./query-config"
import {
  VendorAcceptMemberInvite,
  VendorGetMemberInviteParams,
  VendorInviteMember,
} from "./validators"

const applySellerInviteLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: sellerMemberInvite.entryPoint,
    resourceId: "member_invite_id",
    filterableField: "seller_id",
  })(req, res, next)
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
      applySellerInviteLinkFilter,
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
