import { PayoutAccountDTO, PayoutAccountStatus, PayoutStatus, PayoutWebhookAction } from "./common"
import { BigNumberInput } from "@medusajs/framework/types"

export interface PayoutProviderContext {
  idempotency_key?: string
  account?: PayoutAccountDTO
}

export interface PayoutProviderInput {
  context?: PayoutProviderContext
  data?: Record<string, unknown>
}

export interface PayoutProviderOutput {
  data: Record<string, unknown>
}

export interface CreatePayoutAccountInput extends PayoutProviderInput {
}

export interface CreatePayoutAccountResponse extends PayoutProviderOutput {
  id: string
  status?: PayoutAccountStatus
}

export interface CreatePayoutInput extends PayoutProviderInput {
  amount: BigNumberInput
  currency_code: string
  account_id: string
}

export interface CreatePayoutResponse extends PayoutProviderOutput {
  status?: PayoutStatus
}

export interface CreateOnboardingInput extends PayoutProviderInput {
}

export interface CreateOnboardingResponse extends PayoutProviderOutput {
}

export interface CreateReversalInput extends PayoutProviderInput {
  account_id: string
  amount: BigNumberInput
  currency_code: string
}

export interface CreateReversalResponse extends PayoutProviderOutput {
}

export interface PayoutWebhookActionInput {
  data: Record<string, unknown>
  rawData: string | Buffer
  headers: Record<string, unknown>
}

export type PayoutWebhookResult = {
  action: PayoutWebhookAction,
  data?: {
    /* The ID of the payout, reversal, or account */
    id: string
  }
}

export interface IPayoutProvider {
  createPayoutAccount(
    data: CreatePayoutAccountInput
  ): Promise<CreatePayoutAccountResponse>

  createPayout(data: CreatePayoutInput): Promise<CreatePayoutResponse>

  createOnboarding(
    input: CreateOnboardingInput
  ): Promise<CreateOnboardingResponse>

  createReversal(input: CreateReversalInput): Promise<CreateReversalResponse>

  getWebhookActionAndData(
    payload: PayoutWebhookActionInput
  ): Promise<PayoutWebhookResult>
}
