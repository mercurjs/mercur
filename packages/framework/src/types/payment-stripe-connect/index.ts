import Stripe from 'stripe'

export const PaymentProviderKeys = {
  CARD: 'card'
}

export type PaymentIntentOptions = Omit<
  Stripe.PaymentIntentCreateParams,
  'amount' | 'currency' | 'metadata' | 'transfer_group'
>

export const ErrorCodes = {
  PAYMENT_INTENT_UNEXPECTED_STATE: 'payment_intent_unexpected_state'
}

export const ErrorIntentStatus = {
  SUCCEEDED: 'succeeded',
  CANCELED: 'canceled'
}
