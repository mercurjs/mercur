import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { VendorGetSellerParams } from "../sellers/validators"

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
