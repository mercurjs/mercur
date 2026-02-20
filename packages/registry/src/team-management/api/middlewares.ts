import { MiddlewareRoute } from "@medusajs/framework/http"

import { vendorMembersMiddlewares } from "./vendor/members/middlewares"
import { vendorInvitesMiddlewares } from "./vendor/invites/middlewares"

export const vendorMiddlewares: MiddlewareRoute[] = [
  ...vendorMembersMiddlewares,
  ...vendorInvitesMiddlewares,
]
