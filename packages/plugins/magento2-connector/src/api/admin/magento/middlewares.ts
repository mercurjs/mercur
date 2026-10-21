import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { requirePermission } from "@mercurjs/core/api/utils/permissions-middleware"

import { AdminRecordExternalRefund } from "./orders/validators"
import {
  adminMagentoWebhookDeliveryQueryConfig,
  adminMagentoWebhookQueryConfig,
} from "./webhooks/query-config"
import {
  AdminCreateMagentoWebhook,
  AdminGetMagentoWebhookDeliveriesParams,
  AdminGetMagentoWebhookParams,
  AdminGetMagentoWebhooksParams,
  AdminUpdateMagentoWebhook,
} from "./webhooks/validators"

export const adminMagentoMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/magento/status",
    middlewares: [requirePermission("integrations", "view")],
  },
  {
    method: ["GET"],
    matcher: "/admin/magento/webhooks",
    middlewares: [
      requirePermission("integrations", "view"),
      validateAndTransformQuery(
        AdminGetMagentoWebhooksParams,
        adminMagentoWebhookQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/magento/webhooks",
    middlewares: [
      requirePermission("integrations", "manage"),
      validateAndTransformBody(AdminCreateMagentoWebhook),
      validateAndTransformQuery(
        AdminGetMagentoWebhookParams,
        adminMagentoWebhookQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/magento/webhooks/:id",
    middlewares: [
      requirePermission("integrations", "view"),
      validateAndTransformQuery(
        AdminGetMagentoWebhookParams,
        adminMagentoWebhookQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/magento/webhooks/:id",
    middlewares: [
      requirePermission("integrations", "manage"),
      validateAndTransformBody(AdminUpdateMagentoWebhook),
      validateAndTransformQuery(
        AdminGetMagentoWebhookParams,
        adminMagentoWebhookQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/magento/webhooks/:id",
    middlewares: [requirePermission("integrations", "manage")],
  },
  {
    method: ["GET"],
    matcher: "/admin/magento/webhooks/:id/deliveries",
    middlewares: [
      requirePermission("integrations", "view"),
      validateAndTransformQuery(
        AdminGetMagentoWebhookDeliveriesParams,
        adminMagentoWebhookDeliveryQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/magento/webhooks/:id/deliveries/:delivery_id/redeliver",
    middlewares: [
      requirePermission("integrations", "edit"),
      validateAndTransformQuery(
        AdminGetMagentoWebhookParams,
        adminMagentoWebhookDeliveryQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/magento/orders/:id/refunds/external",
    middlewares: [
      requirePermission("integrations", "edit"),
      validateAndTransformBody(AdminRecordExternalRefund),
    ],
  },
]
