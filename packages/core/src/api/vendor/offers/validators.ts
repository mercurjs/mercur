import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "@medusajs/medusa/api/utils/validators"
import { AdditionalData } from "@medusajs/framework/types"

export type VendorGetOfferParamsType = z.infer<typeof VendorGetOfferParams>
export const VendorGetOfferParams = createSelectParams()

export const VendorGetOffersParamsFields = z
  .object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    variant_id: z.union([z.string(), z.array(z.string())]).optional(),
    shipping_profile_id: z
      .union([z.string(), z.array(z.string())])
      .optional(),
    sku: z.union([z.string(), z.array(z.string())]).optional(),
    ean: z.union([z.string(), z.array(z.string())]).optional(),
    upc: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
  .strict()

export type VendorGetOffersParamsType = z.infer<typeof VendorGetOffersParams>
export const VendorGetOffersParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(VendorGetOffersParamsFields)

const VendorOfferStockLevel = z
  .object({
    location_id: z.string(),
    stocked_quantity: z.number().int().min(0),
  })
  .strict()

const VendorOfferInventoryItem = z
  .object({
    title: z.string().min(1).optional(),
    sku: z.string().min(1).optional(),
    required_quantity: z.number().int().positive().default(1),
    stock_levels: z.array(VendorOfferStockLevel).optional(),
  })
  .strict()

const VendorOfferPrice = z
  .object({
    amount: z.number(),
    currency_code: z.string(),
    min_quantity: z.number().int().positive().nullish(),
    max_quantity: z.number().int().positive().nullish(),
    rules: z.record(z.string(), z.string()).optional(),
  })
  .strict()

const VendorOfferUpsertPrice = z
  .object({
    id: z.string().optional(),
    amount: z.number(),
    currency_code: z.string(),
    min_quantity: z.number().int().positive().nullish(),
    max_quantity: z.number().int().positive().nullish(),
    rules: z.record(z.string(), z.string()).optional(),
  })
  .strict()

const CreateOffer = z
  .object({
    sku: z.string().min(1),
    variant_id: z.string(),
    shipping_profile_id: z.string().min(1),
    inventory_items: z.array(VendorOfferInventoryItem).min(1),
    prices: z.array(VendorOfferPrice).min(1),
    ean: z.string().min(1).nullish(),
    upc: z.string().min(1).nullish(),
    manage_inventory: z.boolean().optional(),
    allow_backorder: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()

export type VendorCreateOfferType = z.infer<typeof CreateOffer> & AdditionalData
export const VendorCreateOffer = WithAdditionalData(CreateOffer)

const UpdateOffer = z
  .object({
    sku: z.string().min(1).optional(),
    shipping_profile_id: z.string().min(1).optional(),
    manage_inventory: z.boolean().optional(),
    allow_backorder: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
    prices: z.array(VendorOfferUpsertPrice).optional(),
  })
  .strict()

export type VendorUpdateOfferType = z.infer<typeof UpdateOffer> & AdditionalData
export const VendorUpdateOffer = WithAdditionalData(UpdateOffer)

const VendorBatchInventoryItemCreate = z
  .object({
    inventory_item_id: z.string(),
    required_quantity: z.number().int().positive().default(1),
  })
  .strict()

const VendorBatchInventoryItemUpdate = z
  .object({
    inventory_item_id: z.string(),
    required_quantity: z.number().int().positive(),
  })
  .strict()

const BatchOfferInventoryItems = z
  .object({
    create: z.array(VendorBatchInventoryItemCreate).optional(),
    update: z.array(VendorBatchInventoryItemUpdate).optional(),
    delete: z.array(z.string()).optional(),
  })
  .strict()

export type VendorBatchOfferInventoryItemsType = z.infer<
  typeof BatchOfferInventoryItems
> &
  AdditionalData
export const VendorBatchOfferInventoryItems = WithAdditionalData(
  BatchOfferInventoryItems
)

const VendorCreateOffersBatchItem = z
  .object({
    sku: z.string().min(1),
    variant_id: z.string(),
    shipping_profile_id: z.string().min(1),
    prices: z.array(VendorOfferPrice).min(1),
    inventory_items: z.array(VendorOfferInventoryItem).min(1),
    ean: z.string().min(1).nullish(),
    upc: z.string().min(1).nullish(),
    manage_inventory: z.boolean().optional(),
    allow_backorder: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()

const CreateOffersBatch = z
  .object({
    offers: z.array(VendorCreateOffersBatchItem).min(1).max(100),
  })
  .strict()

export type VendorCreateOffersBatchType = z.infer<
  typeof CreateOffersBatch
> &
  AdditionalData
export const VendorCreateOffersBatch = WithAdditionalData(CreateOffersBatch)
