import { MedusaError } from "@medusajs/framework/utils"
import { Constructor } from "@medusajs/framework/types"
import {
  IPayoutProvider,
  CreatePayoutAccountInput,
  CreatePayoutAccountResponse,
  CreatePayoutInput,
  CreatePayoutResponse,
  InitializeOnboardingInput,
  InitializeOnboardingResponse,
  CreateReversalInput,
  CreateReversalResponse,
  PayoutWebhookActionInput,
  PayoutWebhookResult,
} from "@mercurjs/types"

export const PayoutProviderIdentifierRegistrationName =
  "payout_providers_identifier"

export const PayoutProviderRegistrationPrefix = "payout_"

type InjectedDependencies = {
  [key: `${typeof PayoutProviderRegistrationPrefix}${string}`]: IPayoutProvider
}

export default class PayoutProviderService {
  protected readonly payoutProvider_: IPayoutProvider

  constructor(container: InjectedDependencies) {
    const payoutProviderKeys = Object.keys(container).filter((k) =>
      k.startsWith(PayoutProviderRegistrationPrefix)
    )

    if (payoutProviderKeys.length !== 1) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Payout module should be initialized with exactly one provider`
      )
    }

    this.payoutProvider_ = container[payoutProviderKeys[0]]
  }

  static getRegistrationIdentifier(
    providerClass: Constructor<IPayoutProvider>,
    optionName?: string
  ) {
    return `${(providerClass as any).identifier}_${optionName}`
  }

  async createPayoutAccount(
    data: CreatePayoutAccountInput
  ): Promise<CreatePayoutAccountResponse> {
    return await this.payoutProvider_.createPayoutAccount(data)
  }

  async createPayout(data: CreatePayoutInput): Promise<CreatePayoutResponse> {
    return await this.payoutProvider_.createPayout(data)
  }

  async initializeOnboarding(
    input: InitializeOnboardingInput
  ): Promise<InitializeOnboardingResponse> {
    return await this.payoutProvider_.initializeOnboarding(input)
  }

  async createReversal(input: CreateReversalInput): Promise<CreateReversalResponse> {
    return await this.payoutProvider_.createReversal(input)
  }

  async getWebhookActionAndData(
    payload: PayoutWebhookActionInput
  ): Promise<PayoutWebhookResult> {
    return await this.payoutProvider_.getWebhookActionAndData(payload)
  }
}
