export interface StripeConnectorAccountValidationOptions {
  /** Require Stripe to mark onboarding details as submitted. */
  detailsSubmitted?: boolean
  /** Require the account to be enabled for charges. */
  chargesEnabled?: boolean
  /** Require the account to be enabled for payouts. */
  payoutsEnabled?: boolean
  /** Treat pending Stripe requirements as a restricted account. */
  noOutstandingRequirements?: boolean
  /** Require specific Stripe capabilities to be active. */
  requiredCapabilities?: string[]
}

export interface StripeConnectPayoutProviderOptions {
  apiKey: string
  webhookSecret: string
  accountValidation?: StripeConnectorAccountValidationOptions
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

export * from "./http"
