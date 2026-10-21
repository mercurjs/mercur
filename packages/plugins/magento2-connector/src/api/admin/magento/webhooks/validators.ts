import { z } from "@medusajs/framework/zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

import { MAGENTO_WEBHOOK_EVENTS } from "../../../../types"

const eventEnum = z.enum(MAGENTO_WEBHOOK_EVENTS)
const statusEnum = z.enum(["pending", "delivered", "failed", "dead"])

export type AdminGetMagentoWebhookParamsType = z.infer<typeof AdminGetMagentoWebhookParams>
export const AdminGetMagentoWebhookParams = createSelectParams()

export type AdminGetMagentoWebhooksParamsType = z.infer<typeof AdminGetMagentoWebhooksParams>
export const AdminGetMagentoWebhooksParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    is_active: booleanString().optional(),
  })
)

export type AdminGetMagentoWebhookDeliveriesParamsType = z.infer<
  typeof AdminGetMagentoWebhookDeliveriesParams
>
export const AdminGetMagentoWebhookDeliveriesParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    status: z.union([statusEnum, z.array(statusEnum)]).optional(),
    event: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
  })
)

export type AdminCreateMagentoWebhookType = z.infer<typeof AdminCreateMagentoWebhook>
export const AdminCreateMagentoWebhook = z
  .object({
    url: z.string().url(),
    secret: z.string().min(16).optional(),
    events: z.array(eventEnum).min(1),
    is_active: z.boolean().optional(),
    description: z.string().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()

export type AdminUpdateMagentoWebhookType = z.infer<typeof AdminUpdateMagentoWebhook>
export const AdminUpdateMagentoWebhook = z
  .object({
    url: z.string().url().optional(),
    secret: z.string().min(16).optional(),
    events: z.array(eventEnum).min(1).optional(),
    is_active: z.boolean().optional(),
    description: z.string().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()
