import { z } from 'zod'

import { PriceListStatus, PriceListType } from '@medusajs/framework/utils'
import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export const VendorGetPriceListPricesParams = createSelectParams()

/**
 * @schema VendorCreatePriceListPrice
 * type: object
 * properties:
 *   variant_id:
 *     type: string
 *     title: variant_id
 *     description: The ID of the product variant this price list is for.
 *   rules:
 *     type: object
 *     description: The price's rules.
 *   currency_code:
 *     type: string
 *     title: currency_code
 *     description: The price's currency code.
 *     example: usd
 *   amount:
 *     type: number
 *     title: amount
 *     description: The price's amount.
 *   min_quantity:
 *     type: number
 *     title: min_quantity
 *     description: The minimum quantity that must be available in the cart for the price to be applied.
 *   max_quantity:
 *     type: number
 *     title: max_quantity
 *     description: The maximum quantity allowed to be available in the cart for the price to be applied.
 */
export type VendorCreatePriceListPriceType = z.infer<
  typeof VendorCreatePriceListPrice
>
export const VendorCreatePriceListPrice = z.object({
  currency_code: z.string(),
  amount: z.number(),
  variant_id: z.string(),
  min_quantity: z.number().nullish(),
  max_quantity: z.number().nullish(),
  rules: z.record(z.string(), z.string()).optional()
})

/**
 * @schema VendorCreatePriceList
 * type: object
 * properties:
 *   title:
 *     type: string
 *     title: title
 *     description: The price list's title.
 *   description:
 *     type: string
 *     title: description
 *     description: The price list's description.
 *   rules:
 *     type: object
 *     description: The price list's rules.
 *   starts_at:
 *     type: string
 *     title: starts_at
 *     description: The date the price list starts.
 *   ends_at:
 *     type: string
 *     title: ends_at
 *     description: The date the price list ends.
 *   status:
 *     type: string
 *     description: The price list's status.
 *     enum:
 *       - draft
 *       - active
 *   type:
 *     type: string
 *     description: The price list's type.
 *     enum:
 *       - sale
 *       - override
 *   prices:
 *     type: array
 *     description: The price list's prices.
 *     items:
 *       $ref: "#/components/schemas/VendorCreatePriceListPrice"
 */
export type VendorCreatePriceListType = z.infer<typeof VendorCreatePriceList>
export const VendorCreatePriceList = z.object({
  title: z.string(),
  description: z.string(),
  starts_at: z.string().nullish(),
  ends_at: z.string().nullish(),
  status: z.nativeEnum(PriceListStatus).optional(),
  type: z.nativeEnum(PriceListType).optional(),
  rules: z.record(z.string(), z.array(z.string())).optional(),
  prices: z.array(VendorCreatePriceListPrice).optional()
})

/**
 * @schema VendorUpdatePriceList
 * type: object
 * properties:
 *   title:
 *     type: string
 *     title: title
 *     description: The price list's title.
 *   description:
 *     type: string
 *     title: description
 *     description: The price list's description.
 *   rules:
 *     type: object
 *     description: The price list's rules.
 *   starts_at:
 *     type: string
 *     title: starts_at
 *     description: The date the price list starts.
 *   ends_at:
 *     type: string
 *     title: ends_at
 *     description: The date the price list ends.
 *   status:
 *     type: string
 *     description: The price list's status.
 *     enum:
 *       - draft
 *       - active
 *   type:
 *     type: string
 *     description: The price list's type.
 *     enum:
 *       - sale
 *       - override
 */
export type VendorUpdatePriceListType = z.infer<typeof VendorUpdatePriceList>
export const VendorUpdatePriceList = z.object({
  title: z.string().optional(),
  description: z.string().nullish(),
  starts_at: z.string().nullish(),
  ends_at: z.string().nullish(),
  status: z.nativeEnum(PriceListStatus).optional(),
  type: z.nativeEnum(PriceListType).optional(),
  rules: z.record(z.string(), z.array(z.string())).optional()
})
