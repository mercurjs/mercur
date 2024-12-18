import { getAmountFromSmallestUnit, getSmallestUnit } from '#/shared/utils'
import { EOL } from 'os'
import Stripe from 'stripe'

import {
  ProviderWebhookPayload,
  UpdatePaymentProviderSession,
  WebhookActionResult
} from '@medusajs/framework/types'
import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
  isPaymentProviderError,
  isPresent
} from '@medusajs/framework/utils'
import { Logger } from '@medusajs/medusa/types'
import {
  CreatePaymentProviderSession,
  PaymentProviderError,
  PaymentProviderSessionResponse
} from '@medusajs/types'

import { PaymentIntentOptions } from '../types'

type Options = {
  apiKey: string
  webhookSecret: string
}

abstract class StripeConnectProvider extends AbstractPaymentProvider<Options> {
  private readonly options_: Options
  private readonly client_: Stripe
  private readonly logger_: Logger
  constructor(container, options: Options) {
    super(container)

    this.options_ = options

    this.logger_ = container.logger
    this.client_ = new Stripe(options.apiKey)
  }

  abstract get paymentIntentOptions(): PaymentIntentOptions

  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentSessionStatus> {
    const id = paymentSessionData.id as string
    const paymentIntent = await this.client_.paymentIntents.retrieve(id)

    switch (paymentIntent.status) {
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'processing':
        return PaymentSessionStatus.PENDING
      case 'requires_action':
        return PaymentSessionStatus.REQUIRES_MORE
      case 'canceled':
        return PaymentSessionStatus.CANCELED
      case 'requires_capture':
        return PaymentSessionStatus.AUTHORIZED
      case 'succeeded':
        return PaymentSessionStatus.CAPTURED
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  async initiatePayment(
    input: CreatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { amount, currency_code } = input
    const { email, session_id } = input.context

    const paymentIntentInput: Stripe.PaymentIntentCreateParams = {
      ...this.paymentIntentOptions,
      currency: currency_code,
      amount: getSmallestUnit(amount, currency_code),
      metadata: { session_id: session_id! },
      transfer_group: session_id!
    }

    // revisit when you could update customer using initiatePayment
    try {
      const {
        data: [customer]
      } = await this.client_.customers.list({
        email,
        limit: 1
      })

      if (customer) {
        paymentIntentInput.customer = customer.id
      }
    } catch (error) {
      return this.buildError(
        'An error occurred in initiatePayment when retrieving a Stripe customer',
        error
      )
    }

    if (!paymentIntentInput.customer) {
      try {
        const customer = await this.client_.customers.create({ email })
        paymentIntentInput.customer = customer.id
      } catch (error) {
        return this.buildError(
          'An error occurred in initiatePayment when creating a Stripe customer',
          error
        )
      }
    }

    let data

    try {
      data = await this.client_.paymentIntents.create(paymentIntentInput)
    } catch (error) {
      return this.buildError(
        'An error occurred in initiatePayment when creating a Stripe payment intent',
        error
      )
    }

    return {
      data
    }
  }

  async authorizePayment(paymentSessionData: Record<string, unknown>): Promise<
    | PaymentProviderError
    | {
        status: PaymentSessionStatus
        data: PaymentProviderSessionResponse['data']
      }
  > {
    const status = await this.getPaymentStatus(paymentSessionData)
    return { data: paymentSessionData, status }
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse['data']> {
    try {
      const id = paymentSessionData.id as string

      if (!id) {
        return paymentSessionData
      }

      return (await this.client_.paymentIntents.cancel(id)) as any
    } catch (error) {
      return this.buildError('An error occurred in cancelPayment', error)
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse['data']> {
    const id = paymentSessionData.id as string
    try {
      const data = await this.client_.paymentIntents.capture(id)
      return data as any
    } catch (error) {
      return this.buildError('An error occurred in capturePayment', error)
    }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse['data']> {
    return await this.cancelPayment(paymentSessionData)
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse['data']> {
    const id = paymentSessionData.id as string

    try {
      const { currency } = paymentSessionData
      await this.client_.refunds.create({
        amount: getSmallestUnit(refundAmount, currency as string),
        payment_intent: id as string
      })
    } catch (e) {
      return this.buildError('An error occurred in refundPayment', e)
    }

    return paymentSessionData
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse['data']> {
    try {
      const id = paymentSessionData.id as string
      const intent = await this.client_.paymentIntents.retrieve(id)

      intent.amount = getAmountFromSmallestUnit(intent.amount, intent.currency)

      return intent as any
    } catch (e) {
      return this.buildError('An error occurred in retrievePayment', e)
    }
  }

  async updatePayment(
    input: UpdatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { data, currency_code, amount } = input

    const amountNumeric = getSmallestUnit(amount, currency_code)

    if (isPresent(amount) && data.amount === amountNumeric) {
      return { data }
    }

    try {
      const id = data.id as string
      const sessionData = (await this.client_.paymentIntents.update(id, {
        amount: amountNumeric
      })) as any

      return { data: sessionData }
    } catch (e) {
      return this.buildError('An error occurred in updatePayment', e)
    }
  }

  async updatePaymentData(sessionId: string, data: Record<string, unknown>) {
    try {
      // Prevent from updating the amount from here as it should go through
      // the updatePayment method to perform the correct logic
      if (isPresent(data.amount)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Cannot update amount, use updatePayment instead'
        )
      }

      return (await this.client_.paymentIntents.update(sessionId, {
        ...data
      })) as any
    } catch (e) {
      return this.buildError('An error occurred in updatePaymentData', e)
    }
  }

  async getWebhookActionAndData(
    webhookData: ProviderWebhookPayload['payload']
  ): Promise<WebhookActionResult> {
    const event = this.constructWebhookEvent(webhookData)
    const intent = event.data.object as Stripe.PaymentIntent

    const { currency } = intent
    switch (event.type) {
      case 'payment_intent.amount_capturable_updated':
        return {
          action: PaymentActions.AUTHORIZED,
          data: {
            session_id: intent.metadata.session_id,
            amount: getAmountFromSmallestUnit(
              intent.amount_capturable,
              currency
            )
          }
        }
      case 'payment_intent.succeeded':
        return {
          action: PaymentActions.SUCCESSFUL,
          data: {
            session_id: intent.metadata.session_id,
            amount: getAmountFromSmallestUnit(intent.amount_received, currency)
          }
        }
      case 'payment_intent.payment_failed':
        return {
          action: PaymentActions.FAILED,
          data: {
            session_id: intent.metadata.session_id,
            amount: getAmountFromSmallestUnit(intent.amount, currency)
          }
        }
      default:
        return { action: PaymentActions.NOT_SUPPORTED }
    }
  }

  constructWebhookEvent(data: ProviderWebhookPayload['payload']): Stripe.Event {
    const signature = data.headers['stripe-signature'] as string

    return this.client_.webhooks.constructEvent(
      data.rawData as string | Buffer,
      signature,
      this.options_.webhookSecret
    )
  }

  private buildError(
    message: string,
    error: Stripe.StripeRawError | PaymentProviderError | Error
  ): PaymentProviderError {
    return {
      error: message,
      code: 'code' in error ? error.code : 'unknown',
      detail: isPaymentProviderError(error)
        ? `${error.error}${EOL}${error.detail ?? ''}`
        : 'detail' in error
          ? error.detail
          : (error.message ?? '')
    }
  }
}

export default StripeConnectProvider
