import { z } from "zod"
import { createSelectParams } from "@medusajs/medusa/api/utils/validators"

const geoZoneBaseSchema = z.object({
  country_code: z.string(),
  metadata: z.record(z.unknown()).nullish(),
})

export const geoZoneCountrySchema = geoZoneBaseSchema.merge(
  z.object({
    type: z.literal("country"),
  })
)

export const geoZoneProvinceSchema = geoZoneBaseSchema.merge(
  z.object({
    type: z.literal("province"),
    province_code: z.string(),
  })
)

export const geoZoneCitySchema = geoZoneBaseSchema.merge(
  z.object({
    type: z.literal("city"),
    province_code: z.string(),
    city: z.string(),
  })
)

export const geoZoneZipSchema = geoZoneBaseSchema.merge(
  z.object({
    type: z.literal("zip"),
    province_code: z.string(),
    city: z.string(),
    postal_expression: z.record(z.unknown()),
  })
)

export type VendorFulfillmentSetParamsType = z.infer<
  typeof VendorFulfillmentSetParams
>
export const VendorFulfillmentSetParams = createSelectParams()

export type VendorServiceZoneParamsType = z.infer<typeof VendorServiceZoneParams>
export const VendorServiceZoneParams = createSelectParams()

export type VendorCreateServiceZoneType = z.infer<
  typeof VendorCreateServiceZone
>
export const VendorCreateServiceZone = z
  .object({
    name: z.string(),
    geo_zones: z
      .array(
        z.union([
          geoZoneCountrySchema,
          geoZoneProvinceSchema,
          geoZoneCitySchema,
          geoZoneZipSchema,
        ])
      )
      .optional(),
  })
  .strict()

export type VendorUpdateServiceZoneType = z.infer<
  typeof VendorUpdateServiceZone
>
export const VendorUpdateServiceZone = z
  .object({
    name: z.string().nullish(),
    geo_zones: z
      .array(
        z.union([
          geoZoneCountrySchema.merge(z.object({ id: z.string().optional() })),
          geoZoneProvinceSchema.merge(z.object({ id: z.string().optional() })),
          geoZoneCitySchema.merge(z.object({ id: z.string().optional() })),
          geoZoneZipSchema.merge(z.object({ id: z.string().optional() })),
        ])
      )
      .optional(),
  })
  .strict()
