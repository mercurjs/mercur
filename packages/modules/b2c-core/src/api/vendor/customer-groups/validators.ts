import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetCustomerGroupsParamsType = z.infer<
  typeof VendorGetCustomerGroupsParams
>
export const VendorGetCustomerGroupsParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * @schema VendorCreateCustomerGroup
 * type: object
 * description: Create customer group details
 * properties:
 *   name:
 *     type: string
 *     description: Customer group name
 */
export type VendorCreateCustomerGroupType = z.infer<
  typeof VendorCreateCustomerGroup
>
export const VendorCreateCustomerGroup = z
  .object({
    name: z.string()
  })
  .strict()

/**
 * @schema VendorLinkCustomersToGroup
 * type: object
 * description: Create customer group details
 * properties:
 *   add:
 *     type: array
 *     description: Customer ids to add.
 *     items:
 *       type: string
 *   remove:
 *     type: array
 *     description: Customer ids to remove.
 *     items:
 *       type: string
 */
export type VendorLinkCustomersToGroupType = z.infer<
  typeof VendorLinkCustomersToGroup
>
export const VendorLinkCustomersToGroup = z
  .object({
    add: z.array(z.string()).default([]),
    remove: z.array(z.string()).default([])
  })
  .strict()
