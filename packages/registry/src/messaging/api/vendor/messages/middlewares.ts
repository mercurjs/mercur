import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import {
  VendorGetMessages,
  VendorListConversations,
  VendorMarkRead,
  VendorSendReply,
} from "./validators"
import { vendorMessagingQueryConfig } from "./query-config"

export const vendorMessagingMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/messages",
    middlewares: [
      validateAndTransformQuery(
        VendorListConversations,
        vendorMessagingQueryConfig.listConversations
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/messages/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetMessages,
        vendorMessagingQueryConfig.listMessages
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/messages/:id",
    middlewares: [
      validateAndTransformBody(VendorSendReply),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/messages/:id/read",
    middlewares: [
      validateAndTransformBody(VendorMarkRead),
    ],
  },
]
