import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type StoreGetWishlistsParamsType = z.infer<
  typeof StoreGetWishlistsParams
>

/**
 * @schema StoreGetWishlistsParams
 * title: "Get Wishlists Parameters"
 * description: "Parameters for retrieving a list of wishlists."
 * x-resourceId: StoreGetWishlistsParams
 * type: object
 * properties:
 *   offset:
 *     type: integer
 *     description: The number of wishlist entries to skip.
 *     default: 0
 *   limit:
 *     type: integer
 *     description: The maximum number of wishlist entries to return.
 *     default: 50
 */

export const StoreGetWishlistsParams = createFindParams({
  offset: 0,
  limit: 50
})

export type StoreCreateWishlistType = z.infer<typeof StoreCreateWishlist>

/**
 * @schema StoreCreateWishlist
 * title: "Create Wishlist Entry"
 * description: "A schema for creating a wishlist entry."
 * x-resourceId: StoreCreateWishlist
 * type: object
 * properties:
 *   reference:
 *     type: string
 *     enum: [product]
 *     description: The type of resource referenced by the wishlist entry.
 *   reference_id:
 *     type: string
 *     description: The ID of the resource being added to the wishlist.
 */

export const StoreCreateWishlist = z.object({
  reference: z.enum(['product']),
  reference_id: z.string()
})
