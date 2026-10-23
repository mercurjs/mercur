import { MedusaError } from "@medusajs/framework/utils"
import { Constructor } from "@medusajs/framework/types"
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
  PayoutOutput,
  PayoutWebhookActionInput,
  PayoutWebhookResult,
  RetrieveAccountInput,
  ReverseTransferInput,
  TransferOutput,
} from "@mercurjs/types"

export const PayoutProviderRegistrationKey = "payout_providers"

export const PayoutProviderRegistrationPrefix = "pop_"

export const SYSTEM_PAYOUT_PROVIDER_ID = "pop_system_default"

type InjectedDependencies = {
  [PayoutProviderRegistrationKey]: string[]
  [key: `${typeof PayoutProviderRegistrationPrefix}${string}`]: IPayoutProvider
}

export default class PayoutProviderService {
  protected readonly container_: InjectedDependencies

  constructor(container: InjectedDependencies) {
    this.container_ = container
  }

  static getRegistrationIdentifier(
    providerClass: Constructor<IPayoutProvider>,
    optionName?: string
  ) {
    return `${(providerClass as unknown as { identifier: string }).identifier}_${optionName}`
  }

  listProviderIds(): string[] {
    const ids = this.container_[PayoutProviderRegistrationKey] ?? []
    return Array.from(new Set(ids))
  }

  /**
   * The provider a new account lands on when the caller names none: the one
   * registered provider that is not the system provider, or the system provider
   * when nothing else is registered.
   */
  getDefaultProviderId(): string {
    const ids = this.listProviderIds().filter((id) => id !== SYSTEM_PAYOUT_PROVIDER_ID)

    if (ids.length === 1) {
      return ids[0]
    }

    if (ids.length === 0) {
      return SYSTEM_PAYOUT_PROVIDER_ID
    }

    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Several payout providers are registered (${ids.join(", ")}); pass provider_id`
    )
  }

  retrieveProvider(providerId: string): IPayoutProvider {
    const provider = this.container_[providerId as `${typeof PayoutProviderRegistrationPrefix}${string}`]

    if (!provider || !this.listProviderIds().includes(providerId)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Payout provider ${providerId} is not registered`
      )
    }

    return provider
  }

  async createAccount(input: WithProviderId<CreateAccountInput>): Promise<AccountOutput> {
    const { provider_id, ...rest } = input
    return await this.retrieveProvider(provider_id).createAccount(rest)
  }

  async retrieveAccount(input: WithProviderId<RetrieveAccountInput>): Promise<AccountOutput> {
    const { provider_id, ...rest } = input
    return await this.retrieveProvider(provider_id).retrieveAccount(rest)
  }

  async listAccounts(
    input: WithProviderId<ListAccountsInput>
  ): Promise<ListAccountsOutput | null> {
    const { provider_id, ...rest } = input
    const provider = this.retrieveProvider(provider_id)
    return provider.listAccounts ? await provider.listAccounts(rest) : null
  }

  async createOnboarding(input: WithProviderId<CreateOnboardingInput>): Promise<LinkOutput> {
    const { provider_id, ...rest } = input
    return await this.retrieveProvider(provider_id).createOnboarding(rest)
  }

  async createLoginLink(
    input: WithProviderId<CreateLoginLinkInput>
  ): Promise<LinkOutput | null> {
    const { provider_id, ...rest } = input
    const provider = this.retrieveProvider(provider_id)
    return provider.createLoginLink ? await provider.createLoginLink(rest) : null
  }

  async createTransfer(input: WithProviderId<CreateTransferInput>): Promise<TransferOutput> {
    const { provider_id, ...rest } = input
    return await this.retrieveProvider(provider_id).createTransfer(rest)
  }

  async reverseTransfer(input: WithProviderId<ReverseTransferInput>): Promise<TransferOutput> {
    const { provider_id, ...rest } = input
    return await this.retrieveProvider(provider_id).reverseTransfer(rest)
  }

  async createAccountDebit(
    input: WithProviderId<CreateAccountDebitInput>
  ): Promise<TransferOutput> {
    const { provider_id, ...rest } = input
    const provider = this.retrieveProvider(provider_id)
    if (!provider.createAccountDebit) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Payout provider ${provider_id} cannot debit a connected account`
      )
    }
    return await provider.createAccountDebit(rest)
  }

  async createPayout(input: WithProviderId<CreatePayoutInput>): Promise<PayoutOutput> {
    const { provider_id, ...rest } = input
    return await this.retrieveProvider(provider_id).createPayout(rest)
  }

  async getWebhookActionAndData(
    input: WithProviderId<PayoutWebhookActionInput>
  ): Promise<PayoutWebhookResult> {
    const { provider_id, ...rest } = input
    return await this.retrieveProvider(provider_id).getWebhookActionAndData(rest)
  }
}

export type WithProviderId<T> = T & { provider_id: string }
