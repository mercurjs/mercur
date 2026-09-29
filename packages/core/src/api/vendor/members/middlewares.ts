import { requirePermission } from "../../utils"
import {
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { VendorGetSellerParams } from "../sellers/validators"
import { VendorAcceptMemberInvite, VendorUpdateMember } from "./validators"

const retrieveVendorMemberMeQueryConfig = {
  get defaults() {
    return ([
      "id",
      "is_owner",
      "member.*",
      "seller.*",
      "seller.address.*",
      "seller.payment_details.*",
      "seller.professional_details.*",
    ])
  },
}

export const vendorMembersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/vendor/members/invites/accept",
    middlewares: [
      authenticate("member", ["session", "bearer"], {
        allowUnregistered: true,
      }),
      validateAndTransformBody(VendorAcceptMemberInvite),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/members/me",
    middlewares: [
      requirePermission("members", "view"),
      validateAndTransformQuery(
        VendorGetSellerParams,
        retrieveVendorMemberMeQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/members/me",
    middlewares: [
      requirePermission("members", "edit"),
      validateAndTransformBody(VendorUpdateMember),
      validateAndTransformQuery(
        VendorGetSellerParams,
        retrieveVendorMemberMeQueryConfig
      ),
    ],
  },
]
