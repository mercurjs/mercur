/* Payment Account */
import { BigNumberInput } from '@medusajs/framework/types'

/**
 * *
 * @enum
 * 
 * SUMMARY

 */
export enum PayoutAccountStatus {
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'pending'

 */
PENDING = 'pending',
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'active'

 */
ACTIVE = 'active',
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'disabled'

 */
DISABLED = 'disabled'
}

/**
 * *
 * @interface
 * 
 * The payout account details.
 * @property {string} id - The ID of the payout account.
 * @property {Date} created_at - The associated date.
 * @property {Date} updated_at - The associated date.
 * @property {string} reference_id - The associated reference's ID.
 * @property {Record<string, unknown>} data - The data of the payout account
 * @property {PayoutAccountStatus} status - The status of the payout account

 */
export type PayoutAccountDTO = {
  /**
 * *
 * The ID of the payout account.

 */
id: string
  /**
 * *
 * The associated date.

 */
created_at: Date
  /**
 * *
 * The associated date.

 */
updated_at: Date
  /**
 * *
 * The associated reference's ID.

 */
reference_id: string
  /**
 * *
 * The data of the payout account

 */
data: Record<string, unknown>
  /**
 * *
 * The status of the payout account

 */
status: PayoutAccountStatus
}

/* Onboarding */

export type OnboardingDTO = {
  /**
 * *
 * The ID of the onboarding.

 */
id: string
  /**
 * *
 * The associated date.

 */
created_at: Date
  /**
 * *
 * The associated date.

 */
updated_at: Date
  /**
 * *
 * The data of the onboarding

 */
data: Record<string, unknown>
  /**
 * *
 * The context of the onboarding

 */
context: Record<string, unknown>
}

/* Payout */

export type PayoutDTO = {
  /**
 * *
 * The ID of the payout.

 */
id: string
  /**
 * *
 * The associated date.

 */
created_at: Date
  /**
 * *
 * The associated date.

 */
updated_at: Date
  /**
 * *
 * The data of the payout

 */
data: Record<string, unknown> | null
  /**
 * *
 * The amount of the payout

 */
amount: BigNumberInput
  /**
 * *
 * The currency code of the payout

 */
currency_code: string
}
