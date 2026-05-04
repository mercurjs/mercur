import { AdminPayment, AdminPaymentCollection } from "@medusajs/types"

export const getTotalCaptured = (
  paymentCollections: AdminPaymentCollection[]
) =>
  paymentCollections.reduce((acc, paymentCollection) => {
    acc =
      acc +
      ((paymentCollection.captured_amount as number) -
        (paymentCollection.refunded_amount as number))
    return acc
  }, 0)

export const getTotalPending = (paymentCollections: AdminPaymentCollection[]) =>
  paymentCollections
    .filter((pc) => pc.status !== "canceled")
    .reduce((acc, paymentCollection) => {
      acc +=
        (paymentCollection.amount as number) -
        (paymentCollection.captured_amount as number)

      return acc
    }, 0)

/**
 * Remaining refundable amount on a single payment: captured minus the
 * sum of recorded refunds, floored at 0.
 *
 * AdminPayment doesn't expose a direct `refunded_amount`; the existing
 * Create Refund form derives it from `payment.refunds[].amount` already
 * (see `create-refund-form.tsx`). This helper consolidates that
 * derivation so refund + balance-settlement forms can prefill and
 * validate against the same computed cap instead of the raw captured
 * amount.
 */
export const getRemainingRefundable = (
  payment: AdminPayment | null | undefined
): number => {
  if (!payment) return 0
  const captured = (payment.amount as number) ?? 0
  const refunded = (payment.refunds ?? []).reduce(
    (sum, refund) => sum + (((refund?.amount as number) ?? 0) as number),
    0
  )
  return Math.max(0, captured - refunded)
}
