import {
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { VendorGetSellerParams } from "../sellers/validators"
import { VendorAcceptMemberInvite } from "./validators"

const retrieveVendorMemberMeQueryConfig = {
  defaults: [
    "id",
    "is_owner",
    "member.*",
    "rbac_role.*",
    "seller.*",
    "seller.address.*",
    "seller.payment_details.*",
    "seller.professional_details.*",
  ],
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
      validateAndTransformQuery(
        VendorGetSellerParams,
        retrieveVendorMemberMeQueryConfig
      ),
    ],
  },
]
