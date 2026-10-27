import {
  AccountOutput,
  CreateAccountInput,
  CreateLoginLinkInput,
  CreateOnboardingInput,
  CreatePayoutInput,
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

export abstract class AbstractPayoutProvider<TConfig = Record<string, unknown>>
  implements IPayoutProvider
{
  static identifier: string
  static _isPayoutProvider = true

  protected readonly config: TConfig
  protected readonly container: Record<string, unknown>

  static validateOptions(_options: Record<string, unknown>): void | never {}

  static isPayoutProvider(object: unknown): boolean {
    return !!(object as { _isPayoutProvider?: boolean })?._isPayoutProvider
  }

  protected constructor(container: Record<string, unknown>, config: TConfig) {
    this.container = container
    this.config = config
  }

  get identifier(): string {
    return (this.constructor as typeof AbstractPayoutProvider).identifier
  }

  abstract createAccount(input: CreateAccountInput): Promise<AccountOutput>
  abstract retrieveAccount(input: RetrieveAccountInput): Promise<AccountOutput>
  listAccounts?(input: ListAccountsInput): Promise<ListAccountsOutput>
  abstract createOnboarding(input: CreateOnboardingInput): Promise<LinkOutput>
  createLoginLink?(input: CreateLoginLinkInput): Promise<LinkOutput>
  abstract createPayout(input: CreatePayoutInput): Promise<PayoutOutput>
  abstract reversePayout(input: ReversePayoutInput): Promise<PayoutOutput>
  abstract getWebhookActionAndData(
    payload: PayoutWebhookActionInput
  ): Promise<PayoutWebhookResult>
}
