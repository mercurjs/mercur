import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetCustomerGroupParamsType = z.infer<
  typeof VendorGetCustomerGroupParams
>
export const VendorGetCustomerGroupParams = createSelectParams()

export type VendorGetCustomerGroupsParamsType = z.infer<
  typeof VendorGetCustomerGroupsParams
>
export const VendorGetCustomerGroupsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type VendorCreateCustomerGroupType = z.infer<
  typeof VendorCreateCustomerGroup
>
export const VendorCreateCustomerGroup = z
  .object({
    name: z.string(),
    metadata: z.record(z.unknown()).nullish(),
  })
  .strict()

export type VendorUpdateCustomerGroupType = z.infer<
  typeof VendorUpdateCustomerGroup
>
export const VendorUpdateCustomerGroup = z
  .object({
    name: z.string().optional(),
    metadata: z.record(z.unknown()).nullish(),
  })
  .strict()

export type VendorManageCustomerGroupCustomersType = z.infer<
  typeof VendorManageCustomerGroupCustomers
>
export const VendorManageCustomerGroupCustomers = z
  .object({
    add: z.array(z.string()).optional(),
    remove: z.array(z.string()).optional(),
  })
  .strict()
