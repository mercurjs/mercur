import Stripe from 'stripe'

import { BigNumberInput } from '@medusajs/framework/types'

import { PayoutWebhookAction } from './events'

export type ProcessPayoutInput = {
  amount: BigNumberInput
  currency: string
  account_reference_id: string
  transaction_id: string
  source_transaction: string
}

export type ReversePayoutInput = {
  transfer_id: string
  amount: BigNumberInput
  currency: string
}

export type ProcessPayoutResponse = {
  data: Record<string, unknown>
}

export type CreatePayoutAccountInput = {
  context: Record<string, unknown>
  account_id: string
}

export type CreatePayoutAccountResponse = {
  data: Record<string, unknown>
  id: string
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

export type InitializeOnboardingResponse = {
  data: Record<string, unknown>
}

export interface IPayoutProvider {
  createPayout(input: ProcessPayoutInput): Promise<ProcessPayoutResponse>
  createPayoutAccount(
    input: CreatePayoutAccountInput
  ): Promise<CreatePayoutAccountResponse>
  reversePayout(input: ReversePayoutInput): Promise<Stripe.TransferReversal>
  /**
   * Initialize the onboarding process for a payout account.
   */
  initializeOnboarding(
    accountId: string,
    context: Record<string, unknown>
  ): Promise<InitializeOnboardingResponse>
  getAccount(accountId: string): Promise<Stripe.Account>
  getWebhookActionAndData(
    payload: PayoutWebhookActionPayload
  ): Promise<PayoutWebhookActionAndDataResponse>
}
