import { MedusaError } from "@medusajs/framework/utils"
import { Constructor } from "@medusajs/framework/types"
import {
  AccountOutput,
  CreateAccountInput,
  CreateLoginLinkInput,
  CreateOnboardingInput,
  CreatePayoutInput,
  DeleteAccountInput,
  IPayoutProvider,
  LinkOutput,
  ListAccountsInput,
  ListAccountsOutput,
  PayoutOutput,
  PayoutWebhookActionInput,
  PayoutWebhookResult,
  RetrieveAccountInput,
  ReversePayoutInput,
} from "@mercurjs/types"

export const PayoutProviderRegistrationPrefix = "pop_"

type InjectedDependencies = {
  [key: `${typeof PayoutProviderRegistrationPrefix}${string}`]: IPayoutProvider
}

export default class PayoutProviderService {
  protected readonly payoutProvider_: IPayoutProvider

  constructor(container: InjectedDependencies) {
    const keys = Object.keys(container).filter((key) =>
      key.startsWith(PayoutProviderRegistrationPrefix)
    )

    if (keys.length !== 1) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Payout module should be initialized with exactly one provider`
      )
    }

    this.payoutProvider_ = container[keys[0]]
  }

  static getRegistrationIdentifier(
    providerClass: Constructor<IPayoutProvider>,
    optionName?: string
  ) {
    return `${(providerClass as unknown as { identifier: string }).identifier}_${optionName}`
  }

  async createAccount(input: CreateAccountInput): Promise<AccountOutput> {
    return await this.payoutProvider_.createAccount(input)
  }

  async retrieveAccount(input: RetrieveAccountInput): Promise<AccountOutput> {
    return await this.payoutProvider_.retrieveAccount(input)
  }

  async deleteAccount(input: DeleteAccountInput): Promise<void> {
    if (this.payoutProvider_.deleteAccount) {
      await this.payoutProvider_.deleteAccount(input)
    }
  }

  async listAccounts(input: ListAccountsInput): Promise<ListAccountsOutput | null> {
    return this.payoutProvider_.listAccounts
      ? await this.payoutProvider_.listAccounts(input)
      : null
  }

  async createOnboarding(input: CreateOnboardingInput): Promise<LinkOutput> {
    return await this.payoutProvider_.createOnboarding(input)
  }

  async createLoginLink(input: CreateLoginLinkInput): Promise<LinkOutput | null> {
    return this.payoutProvider_.createLoginLink
      ? await this.payoutProvider_.createLoginLink(input)
      : null
  }

  async createPayout(input: CreatePayoutInput): Promise<PayoutOutput> {
    return await this.payoutProvider_.createPayout(input)
  }

  async reversePayout(input: ReversePayoutInput): Promise<PayoutOutput> {
    return await this.payoutProvider_.reversePayout(input)
  }

  async getWebhookActionAndData(
    input: PayoutWebhookActionInput
  ): Promise<PayoutWebhookResult> {
    return await this.payoutProvider_.getWebhookActionAndData(input)
  }
}
