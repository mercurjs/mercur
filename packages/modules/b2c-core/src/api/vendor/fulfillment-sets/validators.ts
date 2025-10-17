import { z } from 'zod'

import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export type VendorFulfillmentSetParamsType = z.infer<
  typeof VendorFulfillmentSetParams
>

export const VendorFulfillmentSetParams = createSelectParams()

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
 * properties:
 *   name:
 *     type: string
 *     description: The name of the service zone.
 *   geo_zones:
 *     type: array
 *     description: The geo zones that belong to the service zone.
 *     items:
 *       oneOf:
 *         - $ref: "#/components/schemas/GeoZoneCountry"
 *         - $ref: "#/components/schemas/GeoZoneProvince"
 *         - $ref: "#/components/schemas/GeoZoneCity"
 *         - $ref: "#/components/schemas/GeoZoneZip"
 */
export const VendorCreateFulfillmentSetServiceZonesSchema = z
  .object({
    name: z.string(),
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
 *     description: The name of the service zone.
 *   geo_zones:
 *     type: array
 *     description: The geo zones that belong to the service zone.
 *     items:
 *       oneOf:
 *         - allOf:
 *           - $ref: "#/components/schemas/GeoZoneCountry"
 *           - type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID of the geo zone.
 *         - allOf:
 *           - $ref: "#/components/schemas/GeoZoneProvince"
 *           - type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID of the geo zone.
 *         - allOf:
 *           - $ref: "#/components/schemas/GeoZoneCity"
 *           - type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID of the geo zone.
 *         - allOf:
 *           - $ref: "#/components/schemas/GeoZoneZip"
 *           - type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID of the geo zone.
 */
export const VendorUpdateServiceZone = z
  .object({
    name: z.string().nullish(),
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

export type VendorCreateServiceZoneType = z.infer<
  typeof VendorCreateFulfillmentSetServiceZonesSchema
>
export type VendorUpdateServiceZoneType = z.infer<
  typeof VendorUpdateServiceZone
>
