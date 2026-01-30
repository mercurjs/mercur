import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

export type AdminGetCommissionRateParamsType = z.infer<
  typeof AdminGetCommissionRateParams
>
export const AdminGetCommissionRateParams = createSelectParams()

export type AdminGetCommissionRatesParamsType = z.infer<
  typeof AdminGetCommissionRatesParams
>
export const AdminGetCommissionRatesParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    code: z.union([z.string(), z.array(z.string())]).optional(),
    type: z.union([z.string(), z.array(z.string())]).optional(),
    target: z.union([z.string(), z.array(z.string())]).optional(),
    is_enabled: booleanString().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

const CommissionRuleSchema = z.object({
  reference: z.string(),
  reference_id: z.string(),
})

export type AdminCreateCommissionRateType = z.infer<
  typeof AdminCreateCommissionRate
>
export const AdminCreateCommissionRate = z.object({
  name: z.string(),
  code: z.string(),
  type: z.enum(["fixed", "percentage"]),
  target: z.enum(["item", "shipping"]).optional(),
  value: z.number(),
  currency_code: z.string().nullish(),
  min_amount: z.number().nullish(),
  include_tax: z.boolean().optional(),
  is_enabled: z.boolean().optional(),
  priority: z.number().optional(),
  rules: z.array(CommissionRuleSchema).optional(),
})

export type AdminUpdateCommissionRateType = z.infer<
  typeof AdminUpdateCommissionRate
>
export const AdminUpdateCommissionRate = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  type: z.enum(["fixed", "percentage"]).optional(),
  target: z.enum(["item", "shipping"]).optional(),
  value: z.number().optional(),
  currency_code: z.string().nullish(),
  min_amount: z.number().nullish(),
  include_tax: z.boolean().optional(),
  is_enabled: z.boolean().optional(),
  priority: z.number().optional(),
})

const UpdateCommissionRuleSchema = z.object({
  id: z.string(),
  reference: z.string().optional(),
  reference_id: z.string().optional(),
})

export type AdminBatchCommissionRulesType = z.infer<
  typeof AdminBatchCommissionRules
>
export const AdminBatchCommissionRules = z.object({
  create: z.array(CommissionRuleSchema).optional(),
  update: z.array(UpdateCommissionRuleSchema).optional(),
  delete: z.array(z.string()).optional(),
})
