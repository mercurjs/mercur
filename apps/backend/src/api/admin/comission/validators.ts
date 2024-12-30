import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type AdminComissionRateParamsType = z.infer<
  typeof AdminComissionRateParams
>
export const AdminComissionRateParams = createFindParams({
  offset: 0,
  limit: 50
})

export const ComissionRateType = z.enum(['flat', 'percentage'])

export type AdminCreateComissionRateType = z.infer<
  typeof AdminCreateComissionRate
>
export const AdminCreateComissionRate = z.object({
  type: ComissionRateType,
  percentage_rate: z.number().min(0).max(100).default(0),
  is_default: z.boolean().default(false),
  include_tax: z.boolean(),
  include_shipping: z.boolean(),
  price_set_id: z.string(),
  max_price_set_id: z.string(),
  min_price_set_id: z.string()
})

export type AdminUpdateComissionRateType = z.infer<
  typeof AdminUpdateComissionRate
>
export const AdminUpdateComissionRate = z.object({
  type: ComissionRateType.optional(),
  percentage_rate: z.number().min(0).max(100).optional(),
  is_default: z.boolean().optional(),
  include_tax: z.boolean().optional(),
  include_shipping: z.boolean().optional(),
  price_set_id: z.string().optional(),
  max_price_set_id: z.string().optional(),
  min_price_set_id: z.string().optional()
})

export type AdminComissionRuleParamsType = z.infer<
  typeof AdminComissionRuleParams
>
export const AdminComissionRuleParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * Reference type for comission rule
 * We have simple (one reference_id at once), and combined types: 'seller+product_category', 'seller+product_type'
 * For combined types let's assume that reference_id is also combined in format: 'ref_id1+ref_id2'
 * For example:
 * {
 *  reference: 'seller+product_category'
 *  reference_id: 'sel_01JER8T3FWMY7T8ETYDNNYVE39+pcat_01JENRK39TBX7H88YB5JN63RP2'
 * }
 */
export const ComissionRuleReferenceType = z.enum([
  'site',
  'product_type',
  'product_category',
  'seller_group',
  'seller+product_category',
  'seller+product_type',
  'seller'
])

export type AdminCreateComissionRuleType = z.infer<
  typeof AdminCreateComissionRule
>
export const AdminCreateComissionRule = z.object({
  name: z.string(),
  reference: ComissionRuleReferenceType,
  reference_id: z.string(),
  rate_id: z.string()
})

export type AdminUpdateComissionRuleType = z.infer<
  typeof AdminUpdateComissionRule
>
export const AdminUpdateComissionRule = z.object({
  name: z.string().optional(),
  reference: ComissionRuleReferenceType.optional(),
  reference_id: z.string().optional(),
  rate_id: z.string().optional()
})
