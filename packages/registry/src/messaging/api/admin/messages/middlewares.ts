import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import {
  AdminBlockCustomer,
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
      validateAndTransformQuery(
        AdminSearchConversations,
        adminMessagingQueryConfig.listConversations
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/messages/filters",
    middlewares: [
      validateAndTransformQuery(AdminListFilters, { defaults: ["*"], isList: true }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/messages/filters",
    middlewares: [
      validateAndTransformBody(AdminCreateFilter),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/messages/filters/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateFilter),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/messages/blocked",
    middlewares: [
      validateAndTransformQuery(AdminListBlocked, { defaults: ["*"], isList: true }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/messages/chat-blocks",
    middlewares: [
      validateAndTransformBody(AdminBlockCustomer),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/messages/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetMessages,
        adminMessagingQueryConfig.listMessages
      ),
    ],
  },
]
