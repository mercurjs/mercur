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
  },
]
