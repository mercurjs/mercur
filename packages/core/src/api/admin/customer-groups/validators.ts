import { z } from "zod"

export type AdminGetCustomerGroupOwnersParamsType = z.infer<
  typeof AdminGetCustomerGroupOwnersParams
>
export const AdminGetCustomerGroupOwnersParams = z.object({
  group_ids: z.union([z.string(), z.array(z.string())]),
})
