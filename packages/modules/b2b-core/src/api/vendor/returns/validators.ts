import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetReturnsParamsType = z.infer<typeof VendorGetReturnsParams>
export const VendorGetReturnsParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * @schema VendorReceiveReturn
 * type: object
 * description: The return receival details.
 * properties:
 *   internal_note:
 *     type: string
 *     title: internal_note
 *     description: A note.
 *   description:
 *     type: string
 *     title: description
 *     description: The return's description.
 *   metadata:
 *     type: object
 *     description: The return's metadata, can hold custom key-value pairs.
 */
export type VendorReceiveReturnSchemaType = z.infer<
  typeof VendorReceiveReturnSchema
>
export const VendorReceiveReturnSchema = z.object({
  internal_note: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).nullish()
})

/**
 * @schema VendorReceiveReturnItems
 * type: object
 * description: The items details.
 * x-schemaName: VendorReceiveReturnItems
 * properties:
 *   items:
 *     type: array
 *     description: The items details.
 *     items:
 *       type: object
 *       description: An item's details.
 *       properties:
 *         id:
 *           type: string
 *           title: id
 *           description: The ID of the item in the order.
 *         quantity:
 *           type: number
 *           title: quantity
 *           description: The item's quantity.
 *         internal_note:
 *           type: string
 *           title: internal_note
 *           description: A note.
 */
export type VendorReceiveReturnItemsSchemaType = z.infer<
  typeof VendorReceiveReturnItemsSchema
>
export const VendorReceiveReturnItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().min(1),
      internal_note: z.string().optional()
    })
  )
})

/**
 * @schema VendorReturnsReceiveItemsAction
 * type: object
 * description: The return receival details.
 * properties:
 *   quantity:
 *     type: string
 *     description: Quantity of the item
 *   internal_note:
 *     type: string
 *     description: A note.
 */
export type VendorReturnsReceiveItemsActionSchemaType = z.infer<
  typeof VendorReturnsReceiveItemsActionSchema
>
export const VendorReturnsReceiveItemsActionSchema = z.object({
  quantity: z.number().optional(),
  internal_note: z.string().nullish().optional()
})

/**
 * @schema VendorReturnsDismissItemsAction
 * type: object
 * description: The return receival details.
 * properties:
 *   quantity:
 *     type: string
 *     description: Quantity of the item
 *   internal_note:
 *     type: string
 *     description: A note.
 */
export type VendorReturnsDismissItemsActionSchemaType = z.infer<
  typeof VendorReturnsDismissItemsActionSchema
>
export const VendorReturnsDismissItemsActionSchema = z.object({
  quantity: z.number().optional(),
  internal_note: z.string().nullish().optional()
})
