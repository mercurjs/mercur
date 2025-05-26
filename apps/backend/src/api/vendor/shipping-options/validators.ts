import { z } from 'zod'

import { RuleOperator } from '@medusajs/framework/utils'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetShippingParamsType = z.infer<
  typeof VendorGetShippingFindParams
>

export const VendorGetShippingFindParams = createFindParams({
  offset: 0,
  limit: 50
})

/* Shipping options */

/**
 * @schema CreateShippingOptionPriceWithCurrency
 * type: object
 * required:
 *   - currency_code
 *   - amount
 * properties:
 *   currency_code:
 *     type: string
 *     description: The currency code for the price.
 *   amount:
 *     type: number
 *     description: The amount of the price.
 */
const CreateShippingOptionPriceWithCurrency = z
  .object({
    currency_code: z.string(),
    amount: z.number()
  })
  .strict()

/**
 * @schema CreateShippingOptionTypeObject
 * type: object
 * required:
 *   - label
 *   - description
 *   - code
 * properties:
 *   label:
 *     type: string
 *     description: The label of the shipping option type.
 *   description:
 *     type: string
 *     description: The description of the shipping option type.
 *   code:
 *     type: string
 *     description: The code of the shipping option type.
 */
const CreateShippingOptionTypeObject = z
  .object({
    label: z.string(),
    description: z.string(),
    code: z.string()
  })
  .strict()

/**
 * @schema VendorCreateShippingOptionRule
 * type: object
 * required:
 *   - operator
 *   - attribute
 *   - value
 * properties:
 *   operator:
 *     type: string
 *     description: The operator of the rule.
 *   attribute:
 *     type: string
 *     description: The attribute of the rule.
 *   value:
 *     type: string
 *     description: The value of the rule.
 */
const VendorCreateShippingOptionRule = z
  .object({
    operator: z.nativeEnum(RuleOperator),
    attribute: z.string(),
    value: z.string().or(z.array(z.string()))
  })
  .strict()

/**
 * @schema VendorCreateShippingOption
 * type: object
 * required:
 *   - name
 *   - shipping_profile_id
 *   - provider_id
 *   - prices
 *   - type
 * properties:
 *   name:
 *     type: string
 *     description: The name of the shipping option.
 *   shipping_profile_id:
 *     type: string
 *     description: The ID of the shipping profile.
 *   provider_id:
 *     type: string
 *     description: The ID of the fulfillment provider.
 *   prices:
 *     type: array
 *     description: The prices of the shipping option.
 *     items:
 *       $ref: "#/components/schemas/CreateShippingOptionPriceWithCurrency"
 *   rules:
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/VendorCreateShippingOptionRule"
 *   type:
 *     $ref: "#/components/schemas/CreateShippingOptionTypeObject"
 */
export type VendorCreateShippingOptionType = z.infer<
  typeof VendorCreateShippingOption
>
export const VendorCreateShippingOption = z
  .object({
    name: z.string(),
    service_zone_id: z.string(),
    shipping_profile_id: z.string(),
    data: z.record(z.unknown()).optional(),
    provider_id: z.string(),
    prices: CreateShippingOptionPriceWithCurrency.array(),
    type: CreateShippingOptionTypeObject,
    rules: VendorCreateShippingOptionRule.array().optional()
  })
  .strict()

/**
 * @schema VendorUpdateShippingOption
 * type: object
 * properties:
 *   name:
 *     type: string
 *     description: The name of the shipping option.
 *   shipping_profile_id:
 *     type: string
 *     description: The ID of the shipping profile.
 *   provider_id:
 *     type: string
 *     description: The ID of the fulfillment provider.
 *   prices:
 *     type: array
 *     description: The prices of the shipping option.
 *     items:
 *       $ref: "#/components/schemas/CreateShippingOptionPriceWithCurrency"
 *   rules:
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/VendorCreateShippingOptionRule"
 *   type:
 *     $ref: "#/components/schemas/CreateShippingOptionTypeObject"
 */
export type VendorUpdateShippingOptionType = z.infer<
  typeof VendorUpdateShippingOption
>
export const VendorUpdateShippingOption = z
  .object({
    data: z.record(z.unknown()).optional(),
    name: z.string().optional(),
    shipping_profile_id: z.string().optional(),
    provider_id: z.string().optional(),
    prices: CreateShippingOptionPriceWithCurrency.array().optional(),
    type: CreateShippingOptionTypeObject.optional(),
    rules: VendorCreateShippingOptionRule.array().optional()
  })
  .strict()
