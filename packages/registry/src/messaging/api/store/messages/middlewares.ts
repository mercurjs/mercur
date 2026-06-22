import {
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import {
  StoreCreateConversation,
  StoreGetMessages,
  StoreListConversations,
  StoreMarkRead,
  StoreSendMessage,
} from "./validators"
import { storeMessagingQueryConfig } from "./query-config"

export const storeMessagingMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/messages",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreListConversations,
        storeMessagingQueryConfig.listConversations
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/messages",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreCreateConversation),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/messages/:id",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetMessages,
        storeMessagingQueryConfig.listMessages
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/messages/:id",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreSendMessage),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/messages/:id/read",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreMarkRead),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/messages/unread",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/messages/sse-token",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/messages/events",
    middlewares: [],
  },
]
