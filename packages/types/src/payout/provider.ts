import { BigNumberInput } from "@medusajs/types"
import {
  PayoutAccountRequirements,
  PayoutAccountStatus,
  PayoutStatus,
  PayoutWebhookAction,
} from "./common"

export interface PayoutProviderContext {
  idempotency_key?: string
  [key: string]: unknown
}

export interface PayoutProviderInput {
  context?: PayoutProviderContext
  data?: Record<string, unknown>
}

export interface PayoutProviderOutput {
  data: Record<string, unknown>
}

export interface PayoutProviderAccountRef {
  id: string
  data: Record<string, unknown>
}

export interface CreateAccountInput extends PayoutProviderInput {
  country?: string
  business_type?: "individual" | "company"
  business_profile?: {
    name?: string | null
    url?: string | null
    support_email?: string | null
    support_phone?: string | null
  }
  metadata?: Record<string, string>
}

export interface AccountOutput extends PayoutProviderOutput {
  id: string
  status: PayoutAccountStatus
  payouts_enabled: boolean
  charges_enabled: boolean
  details_submitted: boolean
  disabled_reason: string | null
  requirements: PayoutAccountRequirements
}

export interface RetrieveAccountInput extends PayoutProviderInput {
  account: PayoutProviderAccountRef
}

export interface ListAccountsInput extends PayoutProviderInput {
  limit?: number
  starting_after?: string
}

export interface ListAccountsOutput {
  accounts: AccountOutput[]
  has_more: boolean
}

export interface CreateOnboardingInput extends PayoutProviderInput {
  account: PayoutProviderAccountRef
  refresh_url: string
  return_url: string
}

export interface CreateLoginLinkInput extends PayoutProviderInput {
  account: PayoutProviderAccountRef
}

export interface LinkOutput extends PayoutProviderOutput {
  url: string
  expires_at?: Date | null
}

export interface SourcePaymentRef {
  id: string
  data: Record<string, unknown>
}

export interface CreatePayoutInput extends PayoutProviderInput {
  account: PayoutProviderAccountRef
  amount: BigNumberInput
  currency_code: string
  /**
   * The customer payment the funds come from, for providers that tie a
   * payout to the charge that funded it.
   */
  source_payment?: SourcePaymentRef | null
  group?: string | null
  metadata?: Record<string, string>
}

export interface ReversePayoutInput extends PayoutProviderInput {
  payout: { id: string; data: Record<string, unknown> }
  amount: BigNumberInput
  currency_code: string
  metadata?: Record<string, string>
}

export interface PayoutOutput extends PayoutProviderOutput {
  id: string
  status: PayoutStatus
}

export interface PayoutWebhookActionInput {
  data: Record<string, unknown>
  rawData: string | Buffer
  headers: Record<string, unknown>
}

export type PayoutWebhookResult = {
  action: PayoutWebhookAction
  data?: {
    /** The provider's id of the account or payout the event is about. */
    id: string
    status_reason?: string
  }
}

export class PayoutProviderError extends Error {
  readonly final: boolean

  constructor(message: string, options?: { final?: boolean }) {
    super(message)
    this.name = "PayoutProviderError"
    this.final = options?.final ?? false
  }
}

export interface IPayoutProvider {
  createAccount(input: CreateAccountInput): Promise<AccountOutput>
  retrieveAccount(input: RetrieveAccountInput): Promise<AccountOutput>
  listAccounts?(input: ListAccountsInput): Promise<ListAccountsOutput>
  createOnboarding(input: CreateOnboardingInput): Promise<LinkOutput>
  createLoginLink?(input: CreateLoginLinkInput): Promise<LinkOutput>
  createPayout(input: CreatePayoutInput): Promise<PayoutOutput>
  reversePayout(input: ReversePayoutInput): Promise<PayoutOutput>
  getWebhookActionAndData(payload: PayoutWebhookActionInput): Promise<PayoutWebhookResult>
}
