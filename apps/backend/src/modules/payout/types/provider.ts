import { BigNumberInput } from '@medusajs/framework/types'

import { PayoutAccountStatus } from './common'

export type ProcessTransferContext = {
  amount: BigNumberInput
  currency: string
  reference_id: string
}

export type CreatePayoutAccountData = {
  context: Record<string, unknown>
  account_id: string
}

export type InitializeOnboardingResponse = {
  data: Record<string, unknown>
}

export interface IPayoutProvider {
  processTransfer(context: ProcessTransferContext): Promise<void>
  retryTransfer(context: ProcessTransferContext): Promise<void>
  createPayoutAccount(context: CreatePayoutAccountData): Promise<{
    data: Record<string, unknown>
    id: string
  }>
  updatePayoutAccount(data: Record<string, unknown>): Promise<void>
  getPayoutAccountStatus(
    payoutAccountData: Record<string, unknown>
  ): Promise<PayoutAccountStatus>
  /**
   * Initialize the onboarding process for a payout account.
   */
  initializeOnboarding(
    accountId: string,
    context: Record<string, unknown>
  ): Promise<InitializeOnboardingResponse>
}
