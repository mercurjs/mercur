import { z } from 'zod'

import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetServiceZoneParamsType = z.infer<
  typeof VendorGetServiceZoneParams
>

export const VendorGetServiceZoneParams = createSelectParams()

export type VendorGetShippingOptionParamsType = z.infer<
  typeof VendorGetShippingOptionParams
>

export const VendorGetShippingOptionParams = createSelectParams()

/* Geo zones */

/**
 * @schema GeoZoneBase
 * type: object
 * required:
 *   - country_code
 * properties:
 *   country_code:
 *     type: string
 *     description: The country code of the geo zone.
 */
const geoZoneBaseSchema = z.object({
  country_code: z.string()
})

/**
 * @schema GeoZoneCountry
 * type: object
 * required:
 *   - country_code
 *   - type
 * properties:
 *   country_code:
 *     type: string
 *     description: The country code of the geo zone.
 *   type:
 *     type: string
 *     enum: [country]
 *     description: The type of the geo zone.
 */
export const geoZoneCountry = geoZoneBaseSchema.merge(
  z.object({
    type: z.literal('country')
  })
)

/**
 * @schema GeoZoneProvince
 * type: object
 * required:
 *   - country_code
 *   - type
 *   - province_code
 * properties:
 *   country_code:
 *     type: string
 *     description: The country code of the geo zone.
 *   type:
 *     type: string
 *     enum: [province]
 *     description: The type of the geo zone.
 *   province_code:
 *     type: string
 *     description: The province code of the geo zone.
 */
export const geoZoneProvince = geoZoneBaseSchema.merge(
  z.object({
    type: z.literal('province'),
    province_code: z.string()
  })
)

/**
 * @schema GeoZoneCity
 * type: object
 * required:
 *   - country_code
 *   - type
 *   - province_code
 *   - city
 * properties:
 *   country_code:
 *     type: string
 *     description: The country code of the geo zone.
 *   type:
 *     type: string
 *     enum: [city]
 *     description: The type of the geo zone.
 *   province_code:
 *     type: string
 *     description: The province code of the geo zone.
 *   city:
 *     type: string
 *     description: The city name of the geo zone.
 */
export const geoZoneCity = geoZoneBaseSchema.merge(
  z.object({
    type: z.literal('city'),
    province_code: z.string(),
    city: z.string()
  })
)

/**
 * @schema GeoZoneZip
 * type: object
 * required:
 *   - country_code
 *   - type
 *   - province_code
 *   - city
 *   - postal_expression
 * properties:
 *   country_code:
 *     type: string
 *     description: The country code of the geo zone.
 *   type:
 *     type: string
 *     enum: [zip]
 *     description: The type of the geo zone.
 *   province_code:
 *     type: string
 *     description: The province code of the geo zone.
 *   city:
 *     type: string
 *     description: The city name of the geo zone.
 *   postal_expression:
 *     type: object
 *     description: The postal code expression for the geo zone.
 */
export const geoZoneZip = geoZoneBaseSchema.merge(
  z.object({
    type: z.literal('zip'),
    province_code: z.string(),
    city: z.string(),
    postal_expression: z.record(z.unknown())
  })
)

/* Service zones */

/**
 * @schema VendorCreateServiceZone
 * type: object
 * required:
 *   - name
 *   - fulfillment_set_id
 * properties:
 *   name:
 *     type: string
 *     description: The name of the service zone.
 *   fulfillment_set_id:
 *     type: string
 *     description: The ID of the fulfillment set.
 *   geo_zones:
 *     type: array
 *     description: The geo zones associated with the service zone.
 *     items:
 *       oneOf:
 *         - $ref: "#/components/schemas/GeoZoneCountry"
 *         - $ref: "#/components/schemas/GeoZoneProvince"
 *         - $ref: "#/components/schemas/GeoZoneCity"
 *         - $ref: "#/components/schemas/GeoZoneZip"
 */
export type VendorCreateServiceZoneType = z.infer<
  typeof VendorCreateServiceZone
>

export const VendorCreateServiceZone = z
  .object({
    name: z.string(),
    fulfillment_set_id: z.string(),
    geo_zones: z
      .array(
        z.union([geoZoneCountry, geoZoneProvince, geoZoneCity, geoZoneZip])
      )
      .optional()
  })
  .strict()

/**
 * @schema VendorUpdateServiceZone
 * type: object
 * properties:
 *   name:
 *     type: string
 *     nullable: true
 *     description: The name of the service zone.
 *   fulfillment_set_id:
 *     type: string
 *     description: The ID of the fulfillment set.
 *   geo_zones:
 *     type: array
 *     description: The geo zones associated with the service zone.
 *     items:
 *       oneOf:
 *         - allOf:
 *           - $ref: "#/components/schemas/GeoZoneCountry"
 *           - type: object
 *             properties:
 *               id:
 *                 type: string
 *         - allOf:
 *           - $ref: "#/components/schemas/GeoZoneProvince"
 *           - type: object
 *             properties:
 *               id:
 *                 type: string
 *         - allOf:
 *           - $ref: "#/components/schemas/GeoZoneCity"
 *           - type: object
 *             properties:
 *               id:
 *                 type: string
 *         - allOf:
 *           - $ref: "#/components/schemas/GeoZoneZip"
 *           - type: object
 *             properties:
 *               id:
 *                 type: string
 */
export type VendorUpdateServiceZoneType = z.infer<
  typeof VendorUpdateServiceZone
>
export const VendorUpdateServiceZone = z
  .object({
    name: z.string().nullish(),
    fulfillment_set_id: z.string().optional(),
    geo_zones: z
      .array(
        z.union([
          geoZoneCountry.merge(z.object({ id: z.string().optional() })),
          geoZoneProvince.merge(z.object({ id: z.string().optional() })),
          geoZoneCity.merge(z.object({ id: z.string().optional() })),
          geoZoneZip.merge(z.object({ id: z.string().optional() }))
        ])
      )
      .optional()
  })
  .strict()

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
 *   type:
 *     $ref: "#/components/schemas/CreateShippingOptionTypeObject"
 */
export type VendorCreateShippingOptionType = z.infer<
  typeof VendorCreateShippingOption
>
export const VendorCreateShippingOption = z
  .object({
    name: z.string(),
    shipping_profile_id: z.string(),
    provider_id: z.string(),
    prices: CreateShippingOptionPriceWithCurrency.array(),
    type: CreateShippingOptionTypeObject
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
 *   type:
 *     $ref: "#/components/schemas/CreateShippingOptionTypeObject"
 */
export type VendorUpdateShippingOptionType = z.infer<
  typeof VendorUpdateShippingOption
>
export const VendorUpdateShippingOption = z
  .object({
    name: z.string().optional(),
    shipping_profile_id: z.string().optional(),
    provider_id: z.string().optional(),
    prices: CreateShippingOptionPriceWithCurrency.array().optional(),
    type: CreateShippingOptionTypeObject.optional()
  })
  .strict()
