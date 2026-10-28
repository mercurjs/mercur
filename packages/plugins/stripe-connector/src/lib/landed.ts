import Stripe from "stripe"

import { getAmountFromSmallestUnit } from "./amounts"

/**
 * What a movement added to or took from the connected balance. Stripe converts
 * a transfer into a currency the account holds, so this can differ from the
 * amount and currency that were sent.
 */
export type Landed = { landed_amount: number; landed_currency: string }

type StripeRef<T> = string | T | null | undefined

const idOf = <T extends { id: string }>(ref: StripeRef<T>) => (typeof ref === "string" ? ref : ref?.id ?? null)

const fromBalanceTransaction = (transaction: StripeRef<Stripe.BalanceTransaction>): Landed | null =>
  transaction && typeof transaction !== "string"
    ? {
        landed_amount: getAmountFromSmallestUnit(Math.abs(transaction.net), transaction.currency),
        landed_currency: transaction.currency,
      }
    : null

// The movement already happened, so a failed lookup only loses the landed
// amount; the settlement then falls back to its own currency.
const quietly = async (lookup: () => Promise<Landed | null>) => {
  try {
    return await lookup()
  } catch {
    return null
  }
}

/** The connected account's side of a transfer it received. */
export const landedOfTransfer = (stripe: Stripe, transfer: Stripe.Transfer, stripeAccount: string) => {
  const paymentId = idOf(transfer.destination_payment)
  if (!paymentId) {
    return Promise.resolve(null)
  }
  return quietly(async () =>
    fromBalanceTransaction(
      (await stripe.charges.retrieve(paymentId, { expand: ["balance_transaction"] }, { stripeAccount })).balance_transaction
    )
  )
}

/** The connected account's side of a transfer reversal. */
export const landedOfReversal = (stripe: Stripe, reversal: Stripe.TransferReversal, stripeAccount: string) => {
  const refundId = idOf(reversal.destination_payment_refund)
  if (!refundId) {
    return Promise.resolve(null)
  }
  return quietly(async () =>
    fromBalanceTransaction(
      (await stripe.refunds.retrieve(refundId, { expand: ["balance_transaction"] }, { stripeAccount })).balance_transaction
    )
  )
}

/** A transfer the connected account sent, e.g. a debit back to the platform. */
export const landedOfOutgoingTransfer = (stripe: Stripe, transfer: Stripe.Transfer, stripeAccount: string) => {
  const transactionId = idOf(transfer.balance_transaction)
  if (!transactionId) {
    return Promise.resolve(null)
  }
  return quietly(async () =>
    fromBalanceTransaction(await stripe.balanceTransactions.retrieve(transactionId, {}, { stripeAccount }))
  )
}

/** The landed amount recorded on a payout, reversal or adjustment row. */
export const landedOf = (data: Record<string, unknown> | null | undefined): Landed | null => {
  const source = (data?.provider ?? data) as Partial<Landed> | null | undefined
  return typeof source?.landed_amount === "number" && typeof source?.landed_currency === "string"
    ? { landed_amount: source.landed_amount, landed_currency: source.landed_currency }
    : null
}
