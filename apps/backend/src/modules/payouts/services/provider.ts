import Stripe from 'stripe'

import { ConfigModule, Logger } from '@medusajs/framework/types'

import { PAYOUTS_MODULE } from '..'
import {
  IPayoutsProvider,
  PaymentAccountStatus,
  ProcessTransferContext
} from '../types'

type InjectedDependencies = {
  logger: Logger
  configModule: ConfigModule
}

type StripeConnectConfig = {
  apiKey: string
}

export class PayoutsProvider implements IPayoutsProvider {
  protected config_: StripeConnectConfig
  protected logger_: Logger
  protected client_: Stripe

  constructor({ logger, configModule }: InjectedDependencies) {
    this.logger_ = logger

    const moduleDef = configModule.modules?.[PAYOUTS_MODULE]

    if (typeof moduleDef !== 'boolean' && moduleDef?.options) {
      this.config_ = {
        apiKey: moduleDef.options.api_key as string
      }
    }

    this.client_ = new Stripe(this.config_.apiKey)
  }

  async processTransfer({
    amount,
    currency,
    reference_id
  }: ProcessTransferContext): Promise<void> {
    this.logger_.info('Processing transfer')
  }

  async retryTransfer(): Promise<void> {
    this.logger_.info('Retrying transfer')
  }

  async createPaymentAccount(): Promise<{
    data: Record<string, unknown>
    id: string
  }> {
    this.logger_.info('Creating payment profile')

    return {
      data: {},
      id: 'placeholder'
    }
  }

  async updatePaymentAccount(): Promise<void> {
    this.logger_.info('Updating payment profile')
  }

  async getPaymentProfile(): Promise<void> {
    this.logger_.info('Getting payment profile')
  }

  async getPaymentAccountStatus(): Promise<PaymentAccountStatus> {
    this.logger_.info('Getting payment profile status')

    return PaymentAccountStatus.ACTIVE
  }
}
