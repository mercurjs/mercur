import { z } from "zod"

import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export type VendorGetMemberParamsType = z.infer<typeof VendorGetMemberParams>
export const VendorGetMemberParams = createFindParams({
  offset: 0,
  limit: 50,
})

export type VendorUpdateMemberType = z.infer<typeof VendorUpdateMember>
export const VendorUpdateMember = z
  .object({
    name: z.string().optional(),
    bio: z.string().optional(),
    phone: z.string().optional(),
    photo: z.string().optional(),
  })
  .strict()
