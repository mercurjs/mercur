import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

const ShippingZoneGeo = z
  .object({
    type: z.enum(["country", "province"]).default("country"),
    country_code: z.string().min(2).max(2).toLowerCase(),
    province_code: z.string().min(1).toLowerCase().nullish(),
  })
  .strict()
  .refine((geo) => geo.type !== "province" || !!geo.province_code, {
    message: "province_code is required for a province geo zone",
    path: ["province_code"],
  })

export type AdminGetShippingZoneParamsType = z.infer<
  typeof AdminGetShippingZoneParams
>
export const AdminGetShippingZoneParams = createSelectParams()

export type AdminGetShippingZonesParamsType = z.infer<
  typeof AdminGetShippingZonesParams
>
export const AdminGetShippingZonesParams = createFindParams({
  offset: 0,
  limit: 50,
  order: "name",
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    code: z.union([z.string(), z.array(z.string())]).optional(),
    is_active: booleanString().optional(),
  })
)

export type AdminCreateShippingZoneType = z.infer<
  typeof AdminCreateShippingZone
>
export const AdminCreateShippingZone = z
  .object({
    name: z.string().min(1),
    code: z.string().min(1),
    is_active: z.boolean().optional(),
    geo_zones: z.array(ShippingZoneGeo).min(1),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()

export type AdminUpdateShippingZoneType = z.infer<
  typeof AdminUpdateShippingZone
>
export const AdminUpdateShippingZone = z
  .object({
    name: z.string().min(1).optional(),
    is_active: z.boolean().optional(),
    geo_zones: z.array(ShippingZoneGeo).min(1).optional(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()
