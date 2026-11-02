import crypto from "crypto"

import {
  AccountOutput,
  CreateAccountInput,
  CreateLoginLinkInput,
  CreateOnboardingInput,
  CreatePayoutInput,
  LinkOutput,
  ListAccountsInput,
  ListAccountsOutput,
  PayoutAccountStatus,
  PayoutOutput,
  PayoutStatus,
  PayoutWebhookActionInput,
  PayoutWebhookResult,
  RetrieveAccountInput,
  ReversePayoutInput,
} from "@mercurjs/types"

import { AbstractPayoutProvider } from "../utils/abstract-payout-provider"

const activeAccount = (id: string, data: Record<string, unknown> = {}): AccountOutput => ({
  id,
  status: PayoutAccountStatus.ACTIVE,
  payouts_enabled: true,
  charges_enabled: true,
  details_submitted: true,
  disabled_reason: null,
  requirements: { currently_due: [], past_due: [], pending_verification: [] },
  data,
})

export class SystemPayoutProvider extends AbstractPayoutProvider {
  static identifier = "system"

  constructor(container: Record<string, unknown>, options: Record<string, unknown>) {
    super(container, options)
  }

  async createAccount(_input: CreateAccountInput): Promise<AccountOutput> {
    return activeAccount(crypto.randomUUID())
  }

  async retrieveAccount(input: RetrieveAccountInput): Promise<AccountOutput> {
    return activeAccount(input.account.id, input.account.data)
  }

  async listAccounts(_input: ListAccountsInput): Promise<ListAccountsOutput> {
    return { accounts: [], has_more: false }
  }

  async createOnboarding(input: CreateOnboardingInput): Promise<LinkOutput> {
    return { url: input.return_url, data: {} }
  }

  async createLoginLink(input: CreateLoginLinkInput): Promise<LinkOutput> {
    return { url: `system://account/${input.account.id}`, data: {} }
  }

  async createPayout(_input: CreatePayoutInput): Promise<PayoutOutput> {
    return { id: crypto.randomUUID(), status: PayoutStatus.PAID, data: {} }
  }

  async reversePayout(_input: ReversePayoutInput): Promise<PayoutOutput> {
    return { id: crypto.randomUUID(), status: PayoutStatus.PAID, data: {} }
  }

  async getWebhookActionAndData(
    _payload: PayoutWebhookActionInput
  ): Promise<PayoutWebhookResult> {
    return { action: "not_supported" }
  }
}
