import Stripe from 'stripe'

export const PaymentProviderKeys = {
  CARD: 'card'
}

export type PaymentIntentOptions = Omit<
  Stripe.PaymentIntentCreateParams,
  'amount' | 'currency' | 'metadata' | 'transfer_group'
>
