import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type AdminGetSubscriptionPlansParamsType = z.infer<
  typeof AdminGetSubscriptionPlansParams
>
export const AdminGetSubscriptionPlansParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    currency_code: z.string().optional(),
  })
)

export type AdminGetSubscriptionPlanParamsType = z.infer<
  typeof AdminGetSubscriptionPlanParams
>
export const AdminGetSubscriptionPlanParams = createSelectParams()

export type AdminCreateSubscriptionPlanType = z.infer<
  typeof AdminCreateSubscriptionPlan
>
export const AdminCreateSubscriptionPlan = z.object({
  currency_code: z.string(),
  monthly_amount: z.number(),
  free_months: z.number().int().min(0).max(120).optional(),
  requires_orders: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})

export type AdminUpdateSubscriptionPlanType = z.infer<
  typeof AdminUpdateSubscriptionPlan
>
export const AdminUpdateSubscriptionPlan = z.object({
  monthly_amount: z.number().optional(),
  free_months: z.number().int().min(0).max(120).optional(),
  requires_orders: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})

export type AdminCreateSubscriptionOverrideType = z.infer<
  typeof AdminCreateSubscriptionOverride
>
export const AdminCreateSubscriptionOverride = z.object({
  reference: z.string(),
  reference_id: z.string(),
  monthly_amount: z.number().nullable().optional(),
  free_months: z.number().int().min(0).max(120).nullable().optional(),
  free_from: z.coerce.date().nullable().optional(),
  free_to: z.coerce.date().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})

export type AdminUpdateSubscriptionOverrideType = z.infer<
  typeof AdminUpdateSubscriptionOverride
>
export const AdminUpdateSubscriptionOverride = z.object({
  monthly_amount: z.number().nullable().optional(),
  free_months: z.number().int().min(0).max(120).nullable().optional(),
  free_from: z.coerce.date().nullable().optional(),
  free_to: z.coerce.date().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})
