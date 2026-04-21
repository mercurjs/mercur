import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { z } from "zod"

export type AdminGetMembersParamsType = z.infer<typeof AdminGetMembersParams>
export const AdminGetMembersParams = createFindParams({
  limit: 10,
  offset: 0,
}).extend({
  q: z.string().optional(),
  email: z.string().optional(),
})
