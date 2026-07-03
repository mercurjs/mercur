import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"
import { CommissionRateType } from "@mercurjs/types"

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
    // Virtual filter: the rule scope ("store", "product_type", "category",
    // "store_product_type", "store_category"). Derived from each rate's
    // linked rules in the route, not a stored column.
    scope_type: z.union([z.string(), z.array(z.string())]).optional(),
    is_enabled: booleanString().optional(),
    is_default: booleanString().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

const CommissionRuleSchema = z.object({
  reference: z.string(),
  reference_id: z.string(),
})

const CommissionRateValueSchema = z.object({
  currency_code: z.string(),
  amount: z.number(),
})

export type AdminCreateCommissionRateType = z.infer<
  typeof AdminCreateCommissionRate
>
export const AdminCreateCommissionRate = z.object({
  name: z.string(),
  code: z.string().min(1),
  type: z.nativeEnum(CommissionRateType),
  value: z.number(),
  currency_code: z.string().nullish(),
  include_tax: z.boolean().optional(),
  include_shipping: z.boolean().optional(),
  is_enabled: z.boolean().optional(),
  is_default: z.boolean().optional(),
  rules: z.array(CommissionRuleSchema).optional(),
  values: z.array(CommissionRateValueSchema).optional(),
})

export type AdminUpdateCommissionRateType = z.infer<
  typeof AdminUpdateCommissionRate
>
export const AdminUpdateCommissionRate = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  type: z.nativeEnum(CommissionRateType).optional(),
  value: z.number().optional(),
  currency_code: z.string().nullish(),
  include_tax: z.boolean().optional(),
  include_shipping: z.boolean().optional(),
  is_enabled: z.boolean().optional(),
  values: z.array(CommissionRateValueSchema).optional(),
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
