import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetCustomersParamsType = z.infer<
  typeof VendorGetCustomersParams
>
export const VendorGetCustomersParams = createFindParams({
  offset: 0,
  limit: 50
})

export type VendorGetCustomerOrdersParamsType = z.infer<
  typeof VendorGetCustomerOrdersParams
>
export const VendorGetCustomerOrdersParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * @schema VendorUpdateCustomersCustomerGroups
 * type: object
 * description: Update customers customer groups
 * properties:
 *   add:
 *     type: array
 *     description: Customer group ids to add.
 *     items:
 *       type: string
 *   remove:
 *     type: array
 *     description: Customer group ids to remove.
 *     items:
 *       type: string
 */
export type VendorUpdateCustomerGroupsType = z.infer<
  typeof VendorUpdateCustomerGroups
>
export const VendorUpdateCustomerGroups = z.object({
  add: z.array(z.string()),
  remove: z.array(z.string())
})
