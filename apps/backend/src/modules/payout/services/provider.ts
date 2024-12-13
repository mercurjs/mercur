import Stripe from 'stripe'

import { ConfigModule, Logger } from '@medusajs/framework/types'
import { MedusaError, isPresent } from '@medusajs/framework/utils'

import { PAYOUT_MODULE } from '..'
import {
  CreatePayoutAccountData,
  IPayoutProvider,
  InitializeOnboardingResponse,
  PayoutAccountStatus,
  PayoutWebhookAction,
  PayoutWebhookActionPayload
} from '../types'

type InjectedDependencies = {
  logger: Logger
  configModule: ConfigModule
}

type StripeConnectConfig = {
  apiKey: string
}

export class PayoutProvider implements IPayoutProvider {
  protected config_: StripeConnectConfig
  protected logger_: Logger
  protected client_: Stripe

  constructor({ logger, configModule }: InjectedDependencies) {
    this.logger_ = logger

    const moduleDef = configModule.modules?.[PAYOUT_MODULE]

    if (typeof moduleDef !== 'boolean' && moduleDef?.options) {
      this.config_ = {
        apiKey: moduleDef.options.api_key as string
      }
    }

    this.client_ = new Stripe(this.config_.apiKey)
  }

  async processTransfer(): Promise<void> {
    this.logger_.info('Processing transfer')
  }

  async retryTransfer(): Promise<void> {
    this.logger_.info('Retrying transfer')
  }

  async createPayoutAccount({
    context,
    account_id
  }: CreatePayoutAccountData): Promise<{
    data: Record<string, unknown>
    id: string
  }> {
    const { country } = context
    this.logger_.info('Creating payment profile')

    if (!isPresent(country)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `"country" is required`
      )
    }

    const account = await this.client_.accounts.create({
      country: country as string,
      type: 'standard',
      metadata: {
        account_id
      }
    })

    return {
      data: account as unknown as Record<string, unknown>,
      id: account.id
    }
  }

  async updatePayoutAccount(): Promise<void> {
    this.logger_.info('Updating payment profile')
  }

  async getPaymentProfile(): Promise<void> {
    this.logger_.info('Getting payment profile')
  }

  async getPayoutAccountStatus(): Promise<PayoutAccountStatus> {
    this.logger_.info('Getting payment profile status')

    return PayoutAccountStatus.ACTIVE
  }

  async initializeOnboarding(
    accountId: string,
    context: Record<string, unknown>
  ): Promise<InitializeOnboardingResponse> {
    this.logger_.info('Initializing onboarding')

    if (!isPresent(context.refresh_url)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `"refresh_url" is required`
      )
    }

    if (!isPresent(context.return_url)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `"return_url" is required`
      )
    }

    const accountLink = await this.client_.accountLinks.create({
      account: accountId,
      refresh_url: context.refresh_url as string,
      return_url: context.return_url as string,
      type: 'account_onboarding'
    })

    return {
      data: accountLink as unknown as Record<string, unknown>
    }
  }

  async getWebhookActionAndData(payload: PayoutWebhookActionPayload) {
    this.logger_.info('Getting webhook action')

    return {
      action: PayoutWebhookAction.ACCOUNT_AUTHORIZED,
      data: {
        account_id: payload.data.account_id as string
      }
    }
  }
}
