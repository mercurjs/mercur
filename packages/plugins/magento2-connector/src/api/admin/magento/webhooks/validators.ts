import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

import { MAGENTO_WEBHOOK_EVENTS } from "../../../../types"

const eventEnum = z.enum(MAGENTO_WEBHOOK_EVENTS)

export const AdminGetMagentoWebhookParams = createSelectParams()
export type AdminGetMagentoWebhookParamsType = z.infer<
  typeof AdminGetMagentoWebhookParams
>

export const AdminGetMagentoWebhooksParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    is_active: z.coerce.boolean().optional(),
  })
)
export type AdminGetMagentoWebhooksParamsType = z.infer<
  typeof AdminGetMagentoWebhooksParams
>

export const AdminGetMagentoWebhookDeliveriesParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    status: z
      .union([
        z.enum(["pending", "delivered", "failed", "dead"]),
        z.array(z.enum(["pending", "delivered", "failed", "dead"])),
      ])
      .optional(),
    event: z.union([z.string(), z.array(z.string())]).optional(),
  })
)
export type AdminGetMagentoWebhookDeliveriesParamsType = z.infer<
  typeof AdminGetMagentoWebhookDeliveriesParams
>

export const AdminCreateMagentoWebhook = z.object({
  url: z.string().url(),
  secret: z.string().min(16).optional(),
  events: z.array(eventEnum).min(1),
  is_active: z.boolean().optional(),
  description: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})
export type AdminCreateMagentoWebhookType = z.infer<
  typeof AdminCreateMagentoWebhook
>

export const AdminUpdateMagentoWebhook = z.object({
  url: z.string().url().optional(),
  secret: z.string().min(16).optional(),
  events: z.array(eventEnum).min(1).optional(),
  is_active: z.boolean().optional(),
  description: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})
export type AdminUpdateMagentoWebhookType = z.infer<
  typeof AdminUpdateMagentoWebhook
>
