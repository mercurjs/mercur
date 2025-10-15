import { z } from 'zod'

import { applyAndAndOrOperators } from '@medusajs/medusa/api/utils/common-validators/common'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export const VendorGetInventoryItemsParamsFields = z.object({
  q: z.string().optional(),
  inventory_item_id: z.union([z.string(), z.array(z.string())]).optional()
})

export type VendorGetInventoryItemsParamsType = z.infer<
  typeof VendorGetInventoryItemsParams
>
export const VendorGetInventoryItemsParams = createFindParams({
  offset: 0,
  limit: 50
})
  .merge(VendorGetInventoryItemsParamsFields)
  .merge(applyAndAndOrOperators(VendorGetInventoryItemsParamsFields))
  .strict()

/**
 * @schema VendorUpdateInventoryLevel
 * type: object
 * properties:
 *   stocked_quantity:
 *     type: number
 *     description: The quantity of the InventoryItem in StockLocation.
 *   reserved_quantity:
 *     type: number
 *     title: reserved_quantity
 *     description: The quantity reserved from the available stocked_quantity.
 */
export type VendorUpdateInventoryLevelType = z.infer<
  typeof VendorUpdateInventoryLevel
>
export const VendorUpdateInventoryLevel = z.object({
  stocked_quantity: z.number().int().min(0),
  reserved_quantity: z.number().int().min(0).optional()
})

/**
 * @schema VendorCreateInventoryLevel
 * title: "VendorCreateInventoryLevel"
 * type: object
 * description: The inventory level details.
 * properties:
 *   location_id:
 *     type: string
 *     title: location_id
 *     description: The inventory level locationId.
 *   stocked_quantity:
 *     type: number
 *     title: stocked_quantity
 *     description: The inventory level in stock.
 *   reserved_quantity:
 *     type: number
 *     title: reserved_quantity
 *     description: The quantity reserved from the available stocked_quantity.
 */
export type VendorCreateInventoryLocationLevelType = z.infer<
  typeof VendorCreateInventoryLocationLevel
>
export const VendorCreateInventoryLocationLevel = z
  .object({
    location_id: z.string(),
    stocked_quantity: z.number().int().min(0).optional(),
    reserved_quantity: z.number().int().min(0).optional()
  })
  .strict()

/**
 * @schema VendorUpdateInventoryItem
 * title: "VendorUpdateInventoryItem"
 * type: object
 * description: The inventory item's details.
 * properties:
 *   sku:
 *     type: string
 *     title: sku
 *     description: The inventory item's SKU.
 *   hs_code:
 *     type: string
 *     title: hs_code
 *     description: The inventory item's HS code.
 *   weight:
 *     type: number
 *     title: weight
 *     description: The inventory item's weight.
 *   length:
 *     type: number
 *     title: length
 *     description: The inventory item's length.
 *   height:
 *     type: number
 *     title: height
 *     description: The inventory item's height.
 *   width:
 *     type: number
 *     title: width
 *     description: The inventory item's width.
 *   origin_country:
 *     type: string
 *     title: origin_country
 *     description: The inventory item's origin country.
 *   mid_code:
 *     type: string
 *     title: mid_code
 *     description: The inventory item's mid code.
 *   material:
 *     type: string
 *     title: material
 *     description: The inventory item's material.
 *   title:
 *     type: string
 *     title: title
 *     description: The inventory item's title.
 *   description:
 *     type: string
 *     title: description
 *     description: The description of the variant associated with the inventory item.
 *   requires_shipping:
 *     type: boolean
 *     title: requires_shipping
 *     description: Whether the item requires shipping.
 *   thumbnail:
 *     type: string
 *     title: thumbnail
 *     description: The inventory item's thumbnail.
 *   metadata:
 *     type: object
 *     description: The inventory item's metadata, used to store custom key-value pairs.
 */
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
    metadata: z.record(z.unknown()).nullish()
  })
  .strict()

/**
 * @schema VendorBatchInventoryLocationLevel
 * type: object
 * properties:
 *   inventory_item_id:
 *     type: string
 *     description: The inventory item id.
 *   stocked_quantity:
 *     type: number
 *     description: The quantity of the InventoryItem in StockLocation.
 *   location_id:
 *     type: string
 *     description: The stock location id.
 *   incoming_quantity:
 *     type: number
 *     description: The quantity incoming_quantity.
 */
const VendorBatchInventoryLocationLevel = z
  .object({
    inventory_item_id: z.string(),
    location_id: z.string(),
    stocked_quantity: z.number().min(0).optional(),
    incoming_quantity: z.number().min(0).optional()
  })
  .strict()

/**
 * @schema VendorBatchInventoryItemLevels
 * type: object
 * properties:
 *   create:
 *     type: array
 *     description: Levels to create
 *     items:
 *       $ref: "#/components/schemas/VendorBatchInventoryLocationLevel"
 *   update:
 *     type: array
 *     description: Levels to update
 *     items:
 *       $ref: "#/components/schemas/VendorBatchInventoryLocationLevel"
 *   delete:
 *     type: array
 *     description: Levels to delete
 *     items:
 *       type: string
 */
export type VendorBatchInventoryItemLevelsType = z.infer<
  typeof VendorBatchInventoryItemLevels
>
export const VendorBatchInventoryItemLevels = z
  .object({
    create: z.array(VendorBatchInventoryLocationLevel).optional(),
    update: z.array(VendorBatchInventoryLocationLevel).optional(),
    delete: z.array(z.string()).optional(),
    force: z.boolean().optional()
  })
  .strict()

/**
 * @schema VendorBatchInventoryItemLocationsLevel
 * type: object
 * properties:
 *   create:
 *     type: array
 *     description: Levels to create
 *     items:
 *       $ref: "#/components/schemas/VendorCreateInventoryLevel"
 *   update:
 *     type: array
 *     description: Levels to update
 *     items:
 *       $ref: "#/components/schemas/VendorBatchInventoryLocationLevel"
 *   delete:
 *     type: array
 *     description: Levels to delete
 *     items:
 *       type: string
 */
export type VendorBatchInventoryItemLocationsLevelType = z.infer<
  typeof VendorBatchInventoryItemLocationsLevel
>
export const VendorBatchInventoryItemLocationsLevel = z.object({
  create: z.array(VendorCreateInventoryLocationLevel).optional(),
  update: z.array(VendorBatchInventoryLocationLevel).optional(),
  delete: z.array(z.string()).optional(),
  force: z.boolean().optional()
})
