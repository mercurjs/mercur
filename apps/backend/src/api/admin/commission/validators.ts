import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type AdminCommissionRateParamsType = z.infer<
  typeof AdminCommissionRateParams
>
export const AdminCommissionRateParams = createFindParams({
  offset: 0,
  limit: 50
})

export const CommissionRateType = z.enum(['flat', 'percentage'])

export type AdminCreateCommissionRateType = z.infer<
  typeof AdminCreateCommissionRate
>
export const AdminCreateCommissionRate = z.object({
  type: CommissionRateType,
  percentage_rate: z.number().min(0).max(100).default(0),
  is_default: z.boolean().default(false),
  include_tax: z.boolean(),
  include_shipping: z.boolean(),
  price_set_id: z.string(),
  max_price_set_id: z.string(),
  min_price_set_id: z.string()
})

export type AdminUpdateCommissionRateType = z.infer<
  typeof AdminUpdateCommissionRate
>
export const AdminUpdateCommissionRate = z.object({
  type: CommissionRateType.optional(),
  percentage_rate: z.number().min(0).max(100).optional(),
  is_default: z.boolean().optional(),
  include_tax: z.boolean().optional(),
  include_shipping: z.boolean().optional(),
  price_set_id: z.string().optional(),
  max_price_set_id: z.string().optional(),
  min_price_set_id: z.string().optional()
})

export type AdminCommissionRuleParamsType = z.infer<
  typeof AdminCommissionRuleParams
>
export const AdminCommissionRuleParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * Reference type for commission rule
 * We have simple (one reference_id at once), and combined types: 'seller+product_category', 'seller+product_type'
 * For combined types let's assume that reference_id is also combined in format: 'ref_id1+ref_id2'
 * For example:
 * {
 *  reference: 'seller+product_category'
 *  reference_id: 'sel_01JER8T3FWMY7T8ETYDNNYVE39+pcat_01JENRK39TBX7H88YB5JN63RP2'
 * }
 */
export const CommissionRuleReferenceType = z.enum([
  'site',
  'product_type',
  'product_category',
  'seller_group',
  'seller+product_category',
  'seller+product_type',
  'seller'
])

export type AdminCreateCommissionRuleType = z.infer<
  typeof AdminCreateCommissionRule
>
export const AdminCreateCommissionRule = z.object({
  name: z.string(),
  reference: CommissionRuleReferenceType,
  reference_id: z.string(),
  rate_id: z.string()
})

export type AdminUpdateCommissionRuleType = z.infer<
  typeof AdminUpdateCommissionRule
>
export const AdminUpdateCommissionRule = z.object({
  name: z.string().optional(),
  reference: CommissionRuleReferenceType.optional(),
  reference_id: z.string().optional(),
  rate_id: z.string().optional()
})
