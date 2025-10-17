import { z } from 'zod'

import { MedusaError } from '@medusajs/framework/utils'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export const CommissionRateType = z.enum(['flat', 'percentage'])

/**
 * @schema AdminCommissionRatePrice
 * type: object
 * properties:
 *   currency_code:
 *     type: string
 *     description: Currency of the price.
 *   amount:
 *     type: number
 *     description: The subtitle of the product.
 */
const Price = z.object({
  amount: z.number(),
  currency_code: z.string().refine((z) => z.toLowerCase())
})

/**
 * @schema AdminCreateCommissionRate
 * type: object
 * properties:
 *   type:
 *     type: string
 *     enum: [flat, percentage]
 *     description: Rate type.
 *   percentage_rate:
 *     type: number
 *     description: The subtitle of the product.
 *   include_tax:
 *     type: boolean
 *     description: The description of the product.
 *   price_set:
 *     type: array
 *     items:
 *      $ref: "#/components/schemas/AdminCommissionRatePrice"
 *   min_price_set:
 *     type: array
 *     items:
 *      $ref: "#/components/schemas/AdminCommissionRatePrice"
 *   max_price_set:
 *     type: array
 *     items:
 *      $ref: "#/components/schemas/AdminCommissionRatePrice"
 */
export type AdminCreateCommissionRateType = z.infer<
  typeof AdminCreateCommissionRate
>
export const AdminCreateCommissionRate = z.object({
  type: CommissionRateType,
  percentage_rate: z.number().min(0).max(100).optional(),
  include_tax: z.boolean(),
  price_set: z.array(Price).optional(),
  max_price_set: z.array(Price).optional(),
  min_price_set: z.array(Price).optional()
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
  'product_type',
  'product_category',
  'seller_group',
  'seller+product_category',
  'seller+product_type',
  'seller'
])

/**
 * @schema AdminCreateCommissionRule
 * type: object
 * properties:
 *   name:
 *     type: string
 *     description: Commission rule name.
 *   reference:
 *     type: string
 *     description: Rule reference type
 *   reference_id:
 *     type: string
 *     description: Rule reference id
 *   is_active:
 *     type: boolean
 *     description: Indicates if rule is active.
 *   rate:
 *     $ref: "#/components/schemas/AdminCreateCommissionRate"
 */
export type AdminCreateCommissionRuleType = z.infer<
  typeof AdminCreateCommissionRule
>
export const AdminCreateCommissionRule = z.object({
  name: z.string(),
  reference: CommissionRuleReferenceType,
  reference_id: z.string(),
  is_active: z.boolean().default(true),
  rate: AdminCreateCommissionRate
})

/**
 * @schema AdminUpdateCommissionRule
 * type: object
 * properties:
 *   name:
 *     type: string
 *     description: Commission rule name.
 *   is_active:
 *     type: boolean
 *     description: Indicates if rule is active.
 */
export type AdminUpdateCommissionRuleType = z.infer<
  typeof AdminUpdateCommissionRule
>
export const AdminUpdateCommissionRule = z.object({
  name: z.string().optional(),
  is_active: z.boolean().optional()
})

/**
 * @schema AdminUpsertDefaultCommissionRule
 * type: object
 * properties:
 *   name:
 *     type: string
 *     description: Commission rule name.
 *   reference:
 *     type: string
 *     enum: [site]
 *     description: Rule reference type
 *   reference_id:
 *     type: string
 *     description: Rule reference id
 *   is_active:
 *     type: boolean
 *     description: Indicates if rule is active.
 *   rate:
 *     $ref: "#/components/schemas/AdminCreateCommissionRate"
 */
export type AdminUpsertDefaultCommissionRuleType = z.infer<
  typeof AdminCreateCommissionRule
>
export const AdminUpsertDefaultCommissionRule = z.object({
  name: z.string().default('default'),
  reference: z.enum(['site']).default('site'),
  reference_id: z.enum(['']).default(''),
  is_active: z.boolean().default(true),
  rate: AdminCreateCommissionRate
})

export const validateCommissionRate = (rate: AdminCreateCommissionRateType) => {
  if (
    rate.type === 'flat' &&
    (!rate.price_set || rate.price_set.length === 0)
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Flat rate requires fee value'
    )
  }
  if (
    rate.type === 'percentage' &&
    typeof rate.percentage_rate === 'undefined'
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Percentage rate requires percent value'
    )
  }
}

export const validateCommissionRule = (obj: AdminCreateCommissionRuleType) => {
  const errors = [
    obj.reference === 'seller' && !obj.reference_id.startsWith('sel'),
    obj.reference === 'product_category' &&
      !obj.reference_id.startsWith('pcat'),
    obj.reference === 'product_type' && !obj.reference_id.startsWith('ptyp'),
    obj.reference === 'seller+product_type' &&
      (!obj.reference_id.split('+')[0].startsWith('sel') ||
        !obj.reference_id.split('+')[1].startsWith('ptyp')),
    obj.reference === 'seller+product_category' &&
      (!obj.reference_id.split('+')[0].startsWith('sel') ||
        !obj.reference_id.split('+')[1].startsWith('pcat'))
  ]

  if (errors.find((v) => v)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Invalid reference id'
    )
  }
}

export const AdminGetCommissionLinesParams = createFindParams({
  limit: 15,
  offset: 0
}).merge(
  z.object({
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    seller_id: z.string().optional()
  })
)
export type AdminGetCommissionLinesParamsType = z.infer<
  typeof AdminGetCommissionLinesParams
>
