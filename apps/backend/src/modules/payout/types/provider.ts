import { BigNumberInput } from '@medusajs/framework/types'

import { PayoutAccountStatus, PayoutWebhookAction } from './common'

export type ProcessTransferData = {
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

export type PayoutWebhookActionPayload = {
  data: Record<string, unknown>
  rawData: string | Buffer
  headers: Record<string, unknown>
}

export type PayoutWebhookActionAndDataResponse = {
  action: PayoutWebhookAction
  data: {
    account_id: string
  }
}

export interface IPayoutProvider {
  processTransfer(context: ProcessTransferData): Promise<void>
  retryTransfer(context: ProcessTransferData): Promise<void>
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
  getWebhookActionAndData(
    payload: PayoutWebhookActionPayload
  ): Promise<PayoutWebhookActionAndDataResponse>
}
