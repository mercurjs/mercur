import { getAmountFromSmallestUnit } from '#/shared/utils'
import Stripe from 'stripe'

import { ConfigModule, Logger } from '@medusajs/framework/types'
import { MedusaError, isPresent } from '@medusajs/framework/utils'

import { PAYOUT_MODULE } from '..'
import {
  CreatePayoutAccountInput,
  CreatePayoutAccountResponse,
  IPayoutProvider,
  InitializeOnboardingResponse,
  PayoutWebhookAction,
  PayoutWebhookActionPayload,
  ProcessPayoutInput,
  ProcessPayoutResponse
} from '../types'

type InjectedDependencies = {
  logger: Logger
  configModule: ConfigModule
}

type StripeConnectConfig = {
  apiKey: string
}

export class PayoutProvider implements IPayoutProvider {
  protected readonly config_: StripeConnectConfig
  protected readonly logger_: Logger
  protected readonly client_: Stripe

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

  async processPayout({
    amount,
    currency,
    account_reference_id,
    transaction_id
  }: ProcessPayoutInput): Promise<ProcessPayoutResponse> {
    try {
      this.logger_.info('Processing payout')

      const transfer = await this.client_.transfers.create(
        {
          currency,
          destination: account_reference_id,
          amount: getAmountFromSmallestUnit(amount, currency),
          transfer_group: transaction_id,
          metadata: {
            transaction_id
          }
        },
        { idempotencyKey: transaction_id }
      )

      return {
        data: transfer as unknown as Record<string, unknown>
      }
    } catch (error) {
      const message =
        error?.message ?? 'Error occured while processing transfer'
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message)
    }
  }

  async createPayoutAccount({
    context,
    account_id
  }: CreatePayoutAccountInput): Promise<CreatePayoutAccountResponse> {
    try {
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
    } catch (error) {
      const message =
        error?.message ?? 'Error occured while creating payout account'
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message)
    }
  }

  async initializeOnboarding(
    accountId: string,
    context: Record<string, unknown>
  ): Promise<InitializeOnboardingResponse> {
    try {
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
    } catch (error) {
      const message =
        error?.message ?? 'Error occured while initializing onboarding'
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message)
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
