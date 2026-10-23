import { MedusaError } from "@medusajs/framework/utils"
import {
  AccountOutput,
  CreateAccountDebitInput,
  CreateAccountInput,
  CreateLoginLinkInput,
  CreateOnboardingInput,
  CreatePayoutInput,
  CreateTransferInput,
  IPayoutProvider,
  LinkOutput,
  ListAccountsInput,
  ListAccountsOutput,
  PayoutAccountStatus,
  PayoutOutput,
  PayoutProviderError,
  PayoutStatus,
  PayoutWebhookActionInput,
  PayoutWebhookResult,
  RetrieveAccountInput,
  ReverseTransferInput,
  TransferOutput,
  TransferStatus,
} from "@mercurjs/types"
import Stripe from "stripe"

import { getAmountFromSmallestUnit, getSmallestUnit } from "../../lib/amounts"
import { getStripeClient } from "../../lib/stripe-client"
import { StripeConnectPayoutProviderOptions } from "../../types"

const DEFAULT_ACCOUNT_VALIDATION = {
  detailsSubmitted: true,
  chargesEnabled: true,
  payoutsEnabled: true,
  noOutstandingRequirements: true,
  requiredCapabilities: [] as string[],
}

const asRecord = (value: unknown) => value as unknown as Record<string, unknown>



/**
 * Stripe Connect adapter for the payout module. One Stripe call per method;
 * every Mercur decision (when to transfer, how much, what to retry) stays in
 * core.
 */
export class StripeConnectPayoutProviderService implements IPayoutProvider {
  static identifier = "stripe-connect"
  static _isPayoutProvider = true

  protected readonly stripe_: Stripe
  protected readonly options_: StripeConnectPayoutProviderOptions

  constructor(_cradle: Record<string, unknown>, options: StripeConnectPayoutProviderOptions) {
    StripeConnectPayoutProviderService.validateOptions(options)
    this.options_ = options
    this.stripe_ = getStripeClient(options.apiKey)
  }

  static validateOptions(options: Partial<StripeConnectPayoutProviderOptions>): void {
    if (!options.apiKey) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Stripe Connect payout provider: apiKey is required")
    }
    if (!options.webhookSecret) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Stripe Connect payout provider: webhookSecret is required")
    }
  }

  protected normalizeAccount(account: Stripe.Account): AccountOutput {
    const validation = { ...DEFAULT_ACCOUNT_VALIDATION, ...this.options_.accountValidation }
    const requirements = account.requirements
    const disabledReason = requirements?.disabled_reason ?? null
    const outstanding = {
      currently_due: requirements?.currently_due ?? [],
      past_due: requirements?.past_due ?? [],
      pending_verification: requirements?.pending_verification ?? [],
    }
    const hasOutstanding =
      outstanding.currently_due.length > 0 ||
      outstanding.past_due.length > 0 ||
      outstanding.pending_verification.length > 0
    const inactiveCapability = (validation.requiredCapabilities ?? []).some(
      (capability) => account.capabilities?.[capability as keyof Stripe.Account.Capabilities] !== "active"
    )

    let status: PayoutAccountStatus
    if (disabledReason?.startsWith("rejected")) {
      status = PayoutAccountStatus.REJECTED
    } else if (
      (!validation.detailsSubmitted || account.details_submitted) &&
      (!validation.chargesEnabled || account.charges_enabled) &&
      (!validation.payoutsEnabled || account.payouts_enabled) &&
      (!validation.noOutstandingRequirements || !hasOutstanding) &&
      !inactiveCapability
    ) {
      status = PayoutAccountStatus.ACTIVE
    } else if (!account.details_submitted) {
      status = PayoutAccountStatus.PENDING
    } else {
      status = PayoutAccountStatus.RESTRICTED
    }

    return {
      id: account.id,
      status,
      payouts_enabled: !!account.payouts_enabled,
      charges_enabled: !!account.charges_enabled,
      details_submitted: !!account.details_submitted,
      disabled_reason: disabledReason,
      requirements: outstanding,
      data: asRecord(account),
    }
  }

  async createAccount(input: CreateAccountInput): Promise<AccountOutput> {
    const params: Stripe.AccountCreateParams = {
      type: "express",
      country: input.country,
      metadata: input.metadata,
      ...(input.business_type ? { business_type: input.business_type } : {}),
      ...(input.business_profile
        ? {
            business_profile: {
              name: input.business_profile.name ?? undefined,
              url: input.business_profile.url ?? undefined,
              support_email: input.business_profile.support_email ?? undefined,
              support_phone: input.business_profile.support_phone ?? undefined,
            },
          }
        : {}),
      settings: {
        payouts: {
          debit_negative_balances: false,
          ...(input.settings?.manual_payouts ? { schedule: { interval: "manual" } } : {}),
        },
      },
    }

    const account = await this.stripe_.accounts.create(params, {
      idempotencyKey: input.context?.idempotency_key,
    })

    return this.normalizeAccount(account)
  }

  async retrieveAccount(input: RetrieveAccountInput): Promise<AccountOutput> {
    const account = await this.stripe_.accounts.retrieve(input.account.id)
    return this.normalizeAccount(account)
  }

  async listAccounts(input: ListAccountsInput): Promise<ListAccountsOutput> {
    const page = await this.stripe_.accounts.list({
      limit: input.limit ?? 100,
      starting_after: input.starting_after,
    })
    return {
      accounts: page.data.map((account) => this.normalizeAccount(account)),
      has_more: page.has_more,
    }
  }

  async createOnboarding(input: CreateOnboardingInput): Promise<LinkOutput> {
    const link = await this.stripe_.accountLinks.create({
      account: input.account.id,
      refresh_url: input.refresh_url,
      return_url: input.return_url,
      type: "account_onboarding",
    })
    return {
      url: link.url,
      expires_at: link.expires_at ? new Date(link.expires_at * 1000) : null,
      data: asRecord(link),
    }
  }

  async createLoginLink(input: CreateLoginLinkInput): Promise<LinkOutput> {
    const link = await this.stripe_.accounts.createLoginLink(input.account.id)
    return { url: link.url, data: asRecord(link) }
  }

  protected sourceTransactionFrom(source: CreateTransferInput["source_payment"]): string | undefined {
    if (!source) {
      return undefined
    }
    const data = source.data ?? {}
    const latestCharge = data.latest_charge
    if (typeof latestCharge === "string" && latestCharge.startsWith("ch_")) {
      return latestCharge
    }
    if (latestCharge && typeof latestCharge === "object" && typeof (latestCharge as { id?: string }).id === "string") {
      return (latestCharge as { id: string }).id
    }
    const id = data.id
    if (typeof id === "string" && (id.startsWith("ch_") || id.startsWith("py_"))) {
      return id
    }
    if (typeof id === "string" && id.startsWith("pi_")) {
      return undefined
    }
    throw new PayoutProviderError(`Payment ${source.id} is not a Stripe charge or PaymentIntent`, { final: true })
  }

  protected async resolveSourceTransaction(source: CreateTransferInput["source_payment"]): Promise<string | undefined> {
    const direct = this.sourceTransactionFrom(source)
    if (direct || !source) {
      return direct
    }
    const intent = await this.stripe_.paymentIntents.retrieve(source.data.id as string)
    const charge = intent.latest_charge
    if (!charge) {
      throw new PayoutProviderError(`PaymentIntent ${intent.id} has no charge yet (status ${intent.status})`)
    }
    return typeof charge === "string" ? charge : charge.id
  }

  async createTransfer(input: CreateTransferInput): Promise<TransferOutput> {
    const sourceTransaction = await this.resolveSourceTransaction(input.source_payment)

    const transfer = await this.stripe_.transfers.create(
      {
        amount: getSmallestUnit(input.amount, input.currency_code),
        currency: input.currency_code,
        destination: input.account.id,
        source_transaction: sourceTransaction,
        transfer_group: input.transfer_group ?? undefined,
        metadata: input.metadata,
      },
      { idempotencyKey: input.context?.idempotency_key }
    )

    return { id: transfer.id, status: TransferStatus.CREATED, data: asRecord(transfer) }
  }

  async reverseTransfer(input: ReverseTransferInput): Promise<TransferOutput> {
    const reversal = await this.stripe_.transfers.createReversal(
      input.transfer.id,
      {
        amount: getSmallestUnit(input.amount, input.currency_code),
        metadata: input.metadata,
      },
      { idempotencyKey: input.context?.idempotency_key }
    )

    return { id: reversal.id, status: TransferStatus.CREATED, data: asRecord(reversal) }
  }

  async createAccountDebit(input: CreateAccountDebitInput): Promise<TransferOutput> {
    const platform = await this.stripe_.accounts.retrieve()

    const transfer = await this.stripe_.transfers.create(
      {
        amount: getSmallestUnit(input.amount, input.currency_code),
        currency: input.currency_code,
        destination: platform.id,
        metadata: input.metadata,
      },
      { idempotencyKey: input.context?.idempotency_key, stripeAccount: input.account.id }
    )

    return { id: transfer.id, status: TransferStatus.CREATED, data: asRecord(transfer) }
  }

  async createPayout(input: CreatePayoutInput): Promise<PayoutOutput> {
    const payout = await this.stripe_.payouts.create(
      {
        amount: getSmallestUnit(input.amount, input.currency_code),
        currency: input.currency_code,
        metadata: input.metadata,
      },
      { idempotencyKey: input.context?.idempotency_key, stripeAccount: input.account.id }
    )

    const status =
      payout.status === "paid"
        ? PayoutStatus.PAID
        : payout.status === "failed" || payout.status === "canceled"
          ? PayoutStatus.FAILED
          : PayoutStatus.PROCESSING

    return { id: payout.id, status, data: asRecord(payout) }
  }

  async getWebhookActionAndData(payload: PayoutWebhookActionInput): Promise<PayoutWebhookResult> {
    const signature = payload.headers["stripe-signature"] as string

    const event = this.stripe_.webhooks.constructEvent(
      payload.rawData as string | Buffer,
      signature,
      this.options_.webhookSecret
    )

    switch (event.type) {
      case "account.updated": {
        const account = this.normalizeAccount(event.data.object as Stripe.Account)
        const action =
          account.status === PayoutAccountStatus.REJECTED
            ? "account.rejected"
            : account.status === PayoutAccountStatus.ACTIVE
              ? "account.activated"
              : account.details_submitted
                ? "account.restricted"
                : "account.updated"
        return { action, data: { id: account.id } }
      }
      case "transfer.created":
        return { action: "transfer.created", data: { id: (event.data.object as Stripe.Transfer).id } }
      case "transfer.reversed":
        return { action: "transfer.reversed", data: { id: (event.data.object as Stripe.Transfer).id } }
      case "payout.paid":
        return { action: "payout.paid", data: { id: (event.data.object as Stripe.Payout).id } }
      case "payout.canceled":
        return { action: "payout.canceled", data: { id: (event.data.object as Stripe.Payout).id } }
      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout
        return {
          action: "payout.failed",
          data: {
            id: payout.id,
            status_reason: `${payout.failure_code ?? "unknown_code"}: ${payout.failure_message ?? "Unknown failure reason"}`,
          },
        }
      }
      default:
        return { action: "not_supported" }
    }
  }
}

export { getAmountFromSmallestUnit, getSmallestUnit }
