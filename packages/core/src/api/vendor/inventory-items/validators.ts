import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

export type VendorGetInventoryItemParamsType = z.infer<
  typeof VendorGetInventoryItemParams
>
export const VendorGetInventoryItemParams = createSelectParams()

export const VendorGetInventoryItemsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  sku: z.union([z.string(), z.array(z.string())]).optional(),
  origin_country: z.union([z.string(), z.array(z.string())]).optional(),
  mid_code: z.union([z.string(), z.array(z.string())]).optional(),
  hs_code: z.union([z.string(), z.array(z.string())]).optional(),
  material: z.union([z.string(), z.array(z.string())]).optional(),
  requires_shipping: booleanString().optional(),
  weight: createOperatorMap(z.number(), parseFloat).optional(),
  length: createOperatorMap(z.number(), parseFloat).optional(),
  height: createOperatorMap(z.number(), parseFloat).optional(),
  width: createOperatorMap(z.number(), parseFloat).optional(),
  location_levels: z
    .object({
      location_id: z.union([z.string(), z.array(z.string())]).optional(),
    })
    .optional(),
})

export type VendorGetInventoryItemsParamsType = z.infer<
  typeof VendorGetInventoryItemsParams
>
export const VendorGetInventoryItemsParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(VendorGetInventoryItemsParamsFields)

export type VendorGetInventoryLocationLevelParamsType = z.infer<
  typeof VendorGetInventoryLocationLevelParams
>
export const VendorGetInventoryLocationLevelParams = createSelectParams()

export const VendorGetInventoryLocationLevelsParamsFields = z.object({
  location_id: z.union([z.string(), z.array(z.string())]).optional(),
})

export type VendorGetInventoryLocationLevelsParamsType = z.infer<
  typeof VendorGetInventoryLocationLevelsParams
>
export const VendorGetInventoryLocationLevelsParams = createFindParams({
  limit: 50,
  offset: 0,
}).merge(VendorGetInventoryLocationLevelsParamsFields)

export type VendorCreateInventoryLocationLevelType = z.infer<
  typeof VendorCreateInventoryLocationLevel
>
export const VendorCreateInventoryLocationLevel = z
  .object({
    location_id: z.string(),
    stocked_quantity: z.number().min(0).optional(),
    incoming_quantity: z.number().min(0).optional(),
  })
  .strict()

export type VendorUpdateInventoryLocationLevelBatchType = z.infer<
  typeof VendorUpdateInventoryLocationLevelBatch
>

export const VendorUpdateInventoryLocationLevelBatch = z
  .object({
    id: z.string().optional(),
    location_id: z.string(),
    stocked_quantity: z.number().min(0).optional(),
    incoming_quantity: z.number().min(0).optional(),
  })
  .strict()

export type VendorBatchInventoryItemLocationsLevelType = z.infer<
  typeof VendorBatchInventoryItemLocationsLevel
>

export const VendorBatchInventoryItemLocationsLevel = z.object({
  create: z.array(VendorCreateInventoryLocationLevel).optional(),
  update: z.array(VendorUpdateInventoryLocationLevelBatch).optional(),
  delete: z.array(z.string()).optional(),
  force: z.boolean().optional(),
})

const VendorBatchInventoryLocationLevel = z.object({
  inventory_item_id: z.string(),
  location_id: z.string(),
  stocked_quantity: z.number().min(0).optional(),
  incoming_quantity: z.number().min(0).optional(),
})

export type VendorBatchInventoryItemLevelsType = z.infer<
  typeof VendorBatchInventoryItemLevels
>
export const VendorBatchInventoryItemLevels = z
  .object({
    create: z.array(VendorBatchInventoryLocationLevel).optional(),
    update: z.array(VendorBatchInventoryLocationLevel).optional(),
    delete: z.array(z.string()).optional(),
    force: z.boolean().optional(),
  })
  .strict()

export type VendorUpdateInventoryLocationLevelType = z.infer<
  typeof VendorUpdateInventoryLocationLevel
>
export const VendorUpdateInventoryLocationLevel = z
  .object({
    stocked_quantity: z.number().min(0).optional(),
    incoming_quantity: z.number().min(0).optional(),
  })
  .strict()

export type VendorCreateInventoryItemType = z.infer<
  typeof VendorCreateInventoryItem
>
export const VendorCreateInventoryItem = z
  .object({
    sku: z.string().nullish(),
    hs_code: z.string().nullish(),
    weight: z.number().nullish(),
    length: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    origin_country: z.string().nullish(),
    mid_code: z.string().nullish(),
    material: z.string().nullish(),
    title: z.string().nullish(),
    description: z.string().nullish(),
    requires_shipping: z.boolean().optional(),
    thumbnail: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
    location_levels: z.array(VendorCreateInventoryLocationLevel).optional(),
  })
  .strict()

export type VendorUpdateInventoryItemType = z.infer<
  typeof VendorUpdateInventoryItem
>
export const VendorUpdateInventoryItem = z
  .object({
    sku: z.string().nullish(),
    hs_code: z.string().nullish(),
    weight: z.number().nullish(),
    length: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    origin_country: z.string().nullish(),
    mid_code: z.string().nullish(),
    material: z.string().nullish(),
    title: z.string().nullish(),
    description: z.string().nullish(),
    requires_shipping: z.boolean().optional(),
    thumbnail: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
  })
  .strict()
