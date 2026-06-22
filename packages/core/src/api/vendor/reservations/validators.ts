import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

// Mirrors admin's `AdminGetReservationParams` /
// `AdminGetReservationsParams` / `AdminCreateReservation` /
// `AdminUpdateReservation` shapes one-for-one. Vendor scopes through
// the `inventory_item_seller` link in middlewares — the validator
// surface is the same.

export type VendorGetReservationParamsType = z.infer<
  typeof VendorGetReservationParams
>
export const VendorGetReservationParams = createSelectParams()

export type VendorGetReservationsParamsType = z.infer<
  typeof VendorGetReservationsParams
>
export const VendorGetReservationsParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(
  z.object({
    q: z.string().optional(),
    location_id: z.union([z.string(), z.array(z.string())]).optional(),
    inventory_item_id: z.union([z.string(), z.array(z.string())]).optional(),
    line_item_id: z.union([z.string(), z.array(z.string())]).optional(),
    created_by: z.union([z.string(), z.array(z.string())]).optional(),
    description: z.union([z.string(), createOperatorMap()]).optional(),
    quantity: createOperatorMap(z.number(), parseFloat).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
    deleted_at: createOperatorMap().optional(),
  })
)

export type VendorCreateReservationType = z.infer<typeof VendorCreateReservation>
export const VendorCreateReservation = z
  .object({
    line_item_id: z.string().nullish(),
    location_id: z.string(),
    inventory_item_id: z.string(),
    quantity: z.number(),
    description: z.string().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()

export type VendorUpdateReservationType = z.infer<typeof VendorUpdateReservation>
export const VendorUpdateReservation = z
  .object({
    location_id: z.string().optional(),
    quantity: z.number().optional(),
    description: z.string().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()
