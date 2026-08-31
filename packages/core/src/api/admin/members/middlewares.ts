import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { adminMemberListQueryConfig } from "./query-config"
import { AdminGetMembersParams } from "./validators"

export const adminMembersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/members",
    middlewares: [
      validateAndTransformQuery(
        AdminGetMembersParams,
        adminMemberListQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.seller_member,
        operation: PolicyOperation.read,
      },
    ],
  },
]
