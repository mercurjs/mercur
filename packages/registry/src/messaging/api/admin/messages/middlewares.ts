import {
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import {
  AdminGetMessages,
  AdminSearchConversations,
} from "./validators"
import {
  AdminCreateFilter,
  AdminUpdateFilter,
  AdminListFilters,
  AdminListBlocked,
} from "./filters/validators"
import { adminMessagingQueryConfig } from "./query-config"

export const adminMessagingMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/messages",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformQuery(
        AdminSearchConversations,
        adminMessagingQueryConfig.listConversations
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/messages/events",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/messages/filters",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformQuery(AdminListFilters, { defaults: ["*"], isList: true }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/messages/filters",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(AdminCreateFilter),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/messages/filters/:id",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(AdminUpdateFilter),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/messages/filters/:id",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/messages/blocked",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformQuery(AdminListBlocked, { defaults: ["*"], isList: true }),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/messages/:id",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformQuery(
        AdminGetMessages,
        adminMessagingQueryConfig.listMessages
      ),
    ],
  },
]
