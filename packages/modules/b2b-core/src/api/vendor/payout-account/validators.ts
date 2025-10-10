import { z } from 'zod'

import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetPayoutAccountParamsType = z.infer<
  typeof VendorGetPayoutAccountParams
>
export const VendorGetPayoutAccountParams = createSelectParams()

export type VendorCreatePayoutAccountType = z.infer<
  typeof VendorCreatePayoutAccount
>
/**
 * @schema VendorCreatePayoutAccount
 * type: object
 * properties:
 *   context:
 *     type: object
 *     description: Additional data needed by the payment provider to create a payment account.
 *     nullable: true
 */
export const VendorCreatePayoutAccount = z
  .object({
    context: z.record(z.unknown()).optional()
  })
  .strict()

export type VendorCreateOnboardingType = z.infer<typeof VendorCreateOnboarding>
/**
 * @schema VendorCreateOnboarding
 * type: object
 * properties:
 *   context:
 *     type: object
 *     description: Additional data needed by the payment provider to create onboarding.
 *     nullable: true
 */
export const VendorCreateOnboarding = z
  .object({
    context: z.record(z.unknown()).optional()
  })
  .strict()
