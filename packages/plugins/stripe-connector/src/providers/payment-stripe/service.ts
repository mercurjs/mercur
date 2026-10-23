import {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { PaymentActions } from "@medusajs/framework/utils"
import StripeBase from "@medusajs/payment-stripe/dist/core/stripe-base"
import type { PaymentIntentOptions, StripeOptions } from "@medusajs/payment-stripe/dist/types"
import Stripe from "stripe"

import { ORDER_GROUP_METADATA_KEY, StripeConnectorPaymentProviderOptions } from "../../types"

/**
 * Aggregate payment model: the platform account charges the
 * whole cart once, authorized only, and the payout module captures it when
 * the order group is decided. The PaymentIntent carries the order group so
 * transfers can be grouped and reconciled on Stripe's side.
 */
export class StripeConnectorPaymentProviderService extends StripeBase {
  static identifier = "stripe-connector"

  protected readonly connectorOptions_: StripeConnectorPaymentProviderOptions

  constructor(cradle: Record<string, unknown>, options: StripeConnectorPaymentProviderOptions) {
    super(cradle, { ...options, capture: false } as unknown as StripeOptions)
    this.connectorOptions_ = options
  }

  static validateOptions(options: StripeOptions): void {
    if (!options.apiKey) {
      throw new Error("Stripe connector payment provider: apiKey is required")
    }
    if (!options.webhookSecret) {
      throw new Error("Stripe connector payment provider: webhookSecret is required")
    }
  }

  get paymentIntentOptions(): PaymentIntentOptions {
    return { capture_method: "manual" }
  }

  protected orderGroupKey(): string {
    return this.connectorOptions_.orderGroupMetadataKey ?? ORDER_GROUP_METADATA_KEY
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const cartId = (input.data?.cart_id as string | undefined) ?? (input.context as { cart_id?: string } | undefined)?.cart_id
    const orderGroupId = input.data?.order_group_id as string | undefined
    const metadata = {
      ...((input.data?.metadata as Record<string, string> | undefined) ?? {}),
      ...(cartId ? { mercur_cart_id: cartId } : {}),
      ...(orderGroupId ? { [this.orderGroupKey()]: orderGroupId } : {}),
    }

    return await super.initiatePayment({
      ...input,
      data: {
        ...input.data,
        metadata,
        ...(cartId ? { transfer_group: cartId } : {}),
      },
    })
  }

  /**
   * Adds `latest_charge` to the payment data so the payout provider can use
   * the charge as `source_transaction` without a second round trip.
   */
  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const result = await super.retrievePayment(input)
    const intent = result.data as unknown as Stripe.PaymentIntent | undefined
    if (intent && typeof intent.latest_charge === "object" && intent.latest_charge) {
      return { data: { ...(intent as unknown as Record<string, unknown>), latest_charge: intent.latest_charge.id } }
    }
    return result
  }

  async getWebhookActionAndData(payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    const event = this.constructWebhookEvent(payload)

    // Charge events from connected accounts are not the platform's payments.
    if (event.account) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    return await super.getWebhookActionAndData(payload)
  }
}
