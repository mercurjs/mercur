import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { retrieveTransformQueryConfig } from "@medusajs/medusa/api/admin/users/query-config"
import {
  AdminGetUserParams,
  AdminUpdateUser,
} from "@medusajs/medusa/api/admin/users/validators"

export const adminUsersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/users/me",
    middlewares: [
      validateAndTransformBody(AdminUpdateUser),
      validateAndTransformQuery(AdminGetUserParams, retrieveTransformQueryConfig),
    ],
  },
]
