import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

/**
 * @schema VendorCreateSellerApiKey
 * title: "Create api key"
 * description: "A schema for the api key creation."
 * x-resourceId: VendorCreateSellerApiKey
 * type: object
 * properties:
 *   title:
 *     type: string
 *     description: The title of the key
 */
export type VendorCreateSellerApiKeyType = z.infer<
  typeof VendorCreateSellerApiKey
>
export const VendorCreateSellerApiKey = z.object({
  title: z.string().max(50)
})

export type VendorGetSellerApiKeysParamsType = z.infer<
  typeof VendorGetSellerApiKeysParams
>
export const VendorGetSellerApiKeysParams = createFindParams({
  offset: 0,
  limit: 50
})
