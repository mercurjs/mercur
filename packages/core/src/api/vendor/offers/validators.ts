import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

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

const VendorOfferInventoryItem = z
  .object({
    inventory_item_id: z.string(),
    required_quantity: z.number().int().positive().default(1),
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

export type VendorCreateOfferType = z.infer<typeof VendorCreateOffer>
export const VendorCreateOffer = z
  .object({
    sku: z.string().min(1),
    variant_id: z.string(),
    shipping_profile_id: z.string(),
    inventory_items: z.array(VendorOfferInventoryItem).min(1),
    prices: z.array(VendorOfferPrice).min(1),
    ean: z.string().min(1).nullish(),
    upc: z.string().min(1).nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()

export type VendorUpdateOfferType = z.infer<typeof VendorUpdateOffer>
export const VendorUpdateOffer = z
  .object({
    sku: z.string().min(1).optional(),
    shipping_profile_id: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
    /**
     * Optional full price ladder. When set, the offer's PriceSet is rewritten
     * with this exact list (mirrors Medusa's `updateProductVariantsWorkflow`).
     */
    prices: z.array(VendorOfferUpsertPrice).optional(),
  })
  .strict()

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

export type VendorBatchOfferInventoryItemsType = z.infer<
  typeof VendorBatchOfferInventoryItems
>
export const VendorBatchOfferInventoryItems = z
  .object({
    create: z.array(VendorBatchInventoryItemCreate).optional(),
    update: z.array(VendorBatchInventoryItemUpdate).optional(),
    delete: z.array(z.string()).optional(),
  })
  .strict()

const VendorCreateOffersBatchStockLevel = z
  .object({
    location_id: z.string(),
    stocked_quantity: z.number().int().min(0),
  })
  .strict()

const VendorCreateOffersBatchItem = z
  .object({
    sku: z.string().min(1),
    title: z.string().min(1).optional(),
    variant_id: z.string(),
    shipping_profile_id: z.string(),
    prices: z.array(VendorOfferPrice).min(1),
    stock_levels: z.array(VendorCreateOffersBatchStockLevel).optional(),
    required_quantity: z.number().int().positive().default(1),
    ean: z.string().min(1).nullish(),
    upc: z.string().min(1).nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()

export type VendorCreateOffersBatchType = z.infer<
  typeof VendorCreateOffersBatch
>
export const VendorCreateOffersBatch = z
  .object({
    offers: z.array(VendorCreateOffersBatchItem).min(1).max(100),
  })
  .strict()
