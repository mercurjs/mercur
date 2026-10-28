export interface StripeConnectorAccountValidationOptions {
  detailsSubmitted?: boolean
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  noOutstandingRequirements?: boolean
  requiredCapabilities?: string[]
}

export interface StripeConnectPayoutProviderOptions {
  apiKey: string
  webhookSecret: string
  accountValidation?: StripeConnectorAccountValidationOptions
  /**
   * Put new connected accounts on a manual payout schedule. Turn it on when
   * the plugin's settlements run in `plugin` mode, so bank payouts only
   * leave through a settlement.
   */
  manualPayouts?: boolean
}

export interface StripeConnectorPaymentProviderOptions {
  apiKey: string
  webhookSecret: string
  automaticPaymentMethods?: boolean
  paymentDescription?: string
  /** Metadata key carrying the order group id on the PaymentIntent. */
  orderGroupMetadataKey?: string
}

export const ORDER_GROUP_METADATA_KEY = "mercur_order_group_id"

export * from "./common"
export * from "./http"
