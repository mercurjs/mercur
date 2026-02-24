import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"

import { applySellerMemberFilter, authenticateMember } from "./helpers"
import { vendorMemberQueryConfig } from "./query-config"
import { VendorGetMemberParams, VendorUpdateMember } from "./validators"

export const vendorMembersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/members/me",
    middlewares: [
      authenticateMember(),
      validateAndTransformQuery(
        VendorGetMemberParams,
        vendorMemberQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/members",
    middlewares: [
      authenticateMember(),
      validateAndTransformQuery(
        VendorGetMemberParams,
        vendorMemberQueryConfig.list
      ),
      applySellerMemberFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/members/:id",
    middlewares: [
      authenticateMember(),
      validateAndTransformQuery(
        VendorGetMemberParams,
        vendorMemberQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/members/:id",
    middlewares: [
      authenticateMember(),
      validateAndTransformQuery(
        VendorGetMemberParams,
        vendorMemberQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorUpdateMember),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/members/:id",
    middlewares: [
      authenticateMember(),
    ],
  },
]
