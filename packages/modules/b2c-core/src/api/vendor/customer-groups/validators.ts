import { z } from 'zod'

import {
  createFindParams,
  createOperatorMap,
  createSelectParams
} from '@medusajs/medusa/api/utils/validators'

export type VendorGetCustomerGroupParamsType = z.infer<
  typeof VendorGetCustomerGroupParams
>
export const VendorGetCustomerGroupParams = createSelectParams()

export const VendorCustomerInGroupFilters = z.object({
  id: z.union([z.string(), z.array(z.string())]).optional(),
  email: z
    .union([z.string(), z.array(z.string()), createOperatorMap()])
    .optional(),
  default_billing_address_id: z
    .union([z.string(), z.array(z.string())])
    .optional(),
  default_shipping_address_id: z
    .union([z.string(), z.array(z.string())])
    .optional(),
  company_name: z.union([z.string(), z.array(z.string())]).optional(),
  first_name: z.union([z.string(), z.array(z.string())]).optional(),
  last_name: z.union([z.string(), z.array(z.string())]).optional(),
  created_by: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional()
})

export const VendorGetCustomerGroupsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  name: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .or(createOperatorMap()),
  customers: z
    .union([z.string(), z.array(z.string()), VendorCustomerInGroupFilters])
    .optional(),
  created_by: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional()
})

export type VendorGetCustomerGroupsParamsType = z.infer<
  typeof VendorGetCustomerGroupsParams
>
export const VendorGetCustomerGroupsParams = createFindParams({
  offset: 0,
  limit: 50
})
  // TODO: will be used when we'll get back to using index module
  // .merge(VendorGetCustomerGroupsParamsFields)
  // .merge(applyAndAndOrOperators(VendorGetCustomerGroupsParamsFields))

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
