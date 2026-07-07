import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"
import { AdditionalData } from "@medusajs/framework/types"

export type AdminGetOfferParamsType = z.infer<typeof AdminGetOfferParams>
export const AdminGetOfferParams = createSelectParams()

export type AdminGetOffersParamsType = z.infer<typeof AdminGetOffersParams>
export const AdminGetOffersParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    variant_id: z.union([z.string(), z.array(z.string())]).optional(),
    shipping_profile_id: z
      .union([z.string(), z.array(z.string())])
      .optional(),
    sku: z.union([z.string(), z.array(z.string())]).optional(),
    ean: z.union([z.string(), z.array(z.string())]).optional(),
    upc: z.union([z.string(), z.array(z.string())]).optional(),
    group_by_seller: booleanString().optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    category_id: z.union([z.string(), z.array(z.string())]).optional(),
    collection_id: z.union([z.string(), z.array(z.string())]).optional(),
    type_id: z.union([z.string(), z.array(z.string())]).optional(),
    tag_id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

const AdminOfferPrice = z
  .object({
    amount: z.number(),
    currency_code: z.string(),
    min_quantity: z.number().int().positive().nullish(),
    max_quantity: z.number().int().positive().nullish(),
    rules: z.record(z.string(), z.string()).optional(),
  })
  .strict()

const AdminOfferStockLevel = z
  .object({
    location_id: z.string(),
    stocked_quantity: z.number().int().min(0),
  })
  .strict()

const AdminOfferInventoryItem = z
  .object({
    title: z.string().min(1).optional(),
    sku: z.string().min(1).optional(),
    required_quantity: z.number().int().positive().default(1),
    stock_levels: z.array(AdminOfferStockLevel).optional(),
  })
  .strict()

const AdminCreateOffersBatchItem = z
  .object({
    sku: z.string().min(1),
    variant_id: z.string(),
    shipping_profile_id: z.string(),
    prices: z.array(AdminOfferPrice).min(1),
    inventory_items: z.array(AdminOfferInventoryItem).min(1),
    ean: z.string().min(1).nullish(),
    upc: z.string().min(1).nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()

const CreateOffersBatch = z
  .object({
    seller_id: z.string().min(1),
    offers: z.array(AdminCreateOffersBatchItem).min(1).max(100),
  })
  .strict()
export type AdminCreateOffersBatchType = z.infer<typeof CreateOffersBatch> &
  AdditionalData
export const AdminCreateOffersBatch = WithAdditionalData(CreateOffersBatch)
