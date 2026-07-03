import { z } from "zod"

import { AdminGetCustomerGroupsParams as CoreAdminGetCustomerGroupsParams } from "@medusajs/medusa/api/admin/customer-groups/validators"

// Core's schema is a `.transform(...)` (ZodEffects), so we can't `.merge()` on
// it directly. Compose via intersection, then re-wrap in a noop `.transform()`
// so `validateAndTransformQuery` accepts it.
export const AdminGetCustomerGroupsParams = CoreAdminGetCustomerGroupsParams.and(
  z.object({
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
  })
).transform((v) => v)

export type AdminGetCustomerGroupsParamsType = z.infer<
  typeof AdminGetCustomerGroupsParams
>
