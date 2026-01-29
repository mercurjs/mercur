import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetPayoutAccountParamsType = z.infer<typeof VendorGetPayoutAccountParams>
export const VendorGetPayoutAccountParams = createSelectParams()

export type VendorGetPayoutAccountsParamsType = z.infer<typeof VendorGetPayoutAccountsParams>
export const VendorGetPayoutAccountsParams = createFindParams({
  limit: 20,
  offset: 0,
})

export type VendorCreatePayoutAccountType = z.infer<typeof VendorCreatePayoutAccount>
export const VendorCreatePayoutAccount = z
  .object({
    data: z.record(z.unknown()).optional(),
    context: z.record(z.unknown()).optional(),
  })
  .strict()

export type VendorCreateOnboardingType = z.infer<typeof VendorCreateOnboarding>
export const VendorCreateOnboarding = z
  .object({
    data: z.record(z.unknown()).optional(),
    context: z.record(z.unknown()).optional(),
  })
  .strict()
