import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"

import { applySellerMemberLinkFilter } from "./_helpers/helpers"
import { vendorMemberQueryConfig } from "./query-config"
import { VendorGetMemberParams, VendorUpdateMember } from "./validators"

export const vendorMembersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/members",
    middlewares: [
      validateAndTransformQuery(
        VendorGetMemberParams,
        vendorMemberQueryConfig.list
      ),
      applySellerMemberLinkFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/members/:id",
    middlewares: [
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
    middlewares: [],
  },
]
