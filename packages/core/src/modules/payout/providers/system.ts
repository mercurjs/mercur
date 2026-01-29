import crypto from "crypto"

import {
  CreatePayoutAccountInput,
  CreatePayoutAccountResponse,
  CreatePayoutInput,
  CreatePayoutResponse,
  CreateOnboardingInput,
  CreateOnboardingResponse,
  CreateReversalInput,
  CreateReversalResponse,
  PayoutWebhookActionInput,
  PayoutWebhookResult,
  IPayoutProvider,
  PayoutAccountStatus,
  PayoutStatus,
} from "@mercurjs/types"

export class SystemPayoutProvider implements IPayoutProvider {
  static identifier = "system"

  async createPayoutAccount(
    input: CreatePayoutAccountInput
  ): Promise<CreatePayoutAccountResponse> {
    return {
      id: crypto.randomUUID(),
      status: PayoutAccountStatus.ACTIVE,
      data: {},
    }
  }

  async createPayout(input: CreatePayoutInput): Promise<CreatePayoutResponse> {
    return {
      status: PayoutStatus.PAID,
      data: {},
    }
  }

  async createOnboarding(
    input: CreateOnboardingInput
  ): Promise<CreateOnboardingResponse> {
    return { data: {} }
  }

  async createReversal(
    input: CreateReversalInput
  ): Promise<CreateReversalResponse> {
    return { data: {} }
  }

  async getWebhookActionAndData(
    payload: PayoutWebhookActionInput
  ): Promise<PayoutWebhookResult> {
    return { action: "not_supported" }
  }
}

export default SystemPayoutProvider
