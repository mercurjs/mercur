import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type AdminGetPayoutAccountParamsType = z.infer<typeof AdminGetPayoutAccountParams>
export const AdminGetPayoutAccountParams = createSelectParams()

export type AdminGetPayoutAccountsParamsType = z.infer<typeof AdminGetPayoutAccountsParams>
export const AdminGetPayoutAccountsParams = createFindParams({ offset: 0, limit: 20 }).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    provider_id: z.union([z.string(), z.array(z.string())]).optional(),
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    kyc_status: z.union([z.string(), z.array(z.string())]).optional(),
    payouts_enabled: z.coerce.boolean().optional(),
    ignored: z.coerce.boolean().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type AdminCreatePayoutAccountType = z.infer<typeof AdminCreatePayoutAccount>
export const AdminCreatePayoutAccount = z
  .object({
    seller_id: z.string(),
    provider_id: z.string(),
    provider_account_id: z.string(),
  })
  .strict()

export type AdminIgnorePayoutAccountType = z.infer<typeof AdminIgnorePayoutAccount>
export const AdminIgnorePayoutAccount = z.object({ ignored: z.boolean() }).strict()
