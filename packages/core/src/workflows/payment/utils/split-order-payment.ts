import { BigNumberInput } from "@medusajs/framework/types"
import { defaultCurrencies, MathBN } from "@medusajs/framework/utils"

type BigNumberValue = ReturnType<typeof MathBN.convert>

export type SplitOrderTransaction = {
  reference?: string | null
  reference_id?: string | null
  amount?: BigNumberInput | null
  raw_amount?: BigNumberInput | null
}

export type SplitOrderPaymentMovements = {
  captures?: { id: string }[] | null
  refunds?: { id: string }[] | null
}

const DEFAULT_DECIMAL_DIGITS = 2

export const getCurrencyDecimalDigits = (currencyCode?: string | null) => {
  const currency = defaultCurrencies[(currencyCode ?? "").toUpperCase()]
  return currency?.decimal_digits ?? DEFAULT_DECIMAL_DIGITS
}

const floorTo = (value: BigNumberValue, decimalDigits: number) => {
  const rounded = MathBN.convert(value, decimalDigits)
  if (MathBN.lte(rounded, value)) {
    return rounded
  }
  return MathBN.sub(rounded, MathBN.div(1, MathBN.convert(10).pow(decimalDigits)))
}

/**
 * Splits `amount` across `weights` proportionally. Shares are rounded down to
 * the currency precision and the remainder is handed out one minor unit at a
 * time to the largest fractions, so the shares always sum exactly to `amount`.
 */
export const allocateProportionally = ({
  amount,
  weights,
  decimalDigits,
}: {
  amount: BigNumberInput
  weights: BigNumberInput[]
  decimalDigits: number
}): BigNumberValue[] => {
  if (!weights.length) {
    return []
  }

  const total = MathBN.convert(amount)
  const positiveWeights = weights.map((weight) =>
    MathBN.max(MathBN.convert(weight), 0)
  )
  const weightSum = positiveWeights.reduce(
    (acc, weight) => MathBN.add(acc, weight),
    MathBN.convert(0)
  )
  const effectiveWeights = MathBN.gt(weightSum, 0)
    ? positiveWeights
    : positiveWeights.map(() => MathBN.convert(1))
  const effectiveSum = MathBN.gt(weightSum, 0)
    ? weightSum
    : MathBN.convert(effectiveWeights.length)

  const unit = MathBN.div(1, MathBN.convert(10).pow(decimalDigits))
  const exact = effectiveWeights.map((weight) =>
    MathBN.div(MathBN.mult(total, weight), effectiveSum)
  )
  const shares = exact.map((share) => floorTo(share, decimalDigits))

  let leftover = MathBN.sub(
    total,
    shares.reduce((acc, share) => MathBN.add(acc, share), MathBN.convert(0))
  )

  const byLargestFraction = exact
    .map((share, index) => ({
      index,
      fraction: MathBN.sub(share, shares[index]),
    }))
    .sort((a, b) =>
      MathBN.eq(a.fraction, b.fraction)
        ? a.index - b.index
        : MathBN.gt(a.fraction, b.fraction)
        ? -1
        : 1
    )

  for (const { index } of byLargestFraction) {
    if (MathBN.lt(leftover, unit)) {
      break
    }
    shares[index] = MathBN.add(shares[index], unit)
    leftover = MathBN.sub(leftover, unit)
  }

  // Only reachable when `amount` itself is finer than the currency precision.
  if (MathBN.gt(leftover, 0)) {
    const { index } = byLargestFraction[0]
    shares[index] = MathBN.add(shares[index], leftover)
  }

  return shares
}

/**
 * What an order currently holds of a payment: its capture transactions minus
 * its refund transactions. Pass `payment` to count only that payment's
 * movements when the collection holds more than one.
 */
export const getOrderCapturedBalance = (
  transactions: SplitOrderTransaction[] | null | undefined,
  payment?: SplitOrderPaymentMovements
): BigNumberValue => {
  const referenceIds = payment
    ? new Set(
        [...(payment.captures ?? []), ...(payment.refunds ?? [])].map(
          (movement) => movement.id
        )
      )
    : undefined

  return (transactions ?? []).reduce((acc, transaction) => {
    if (
      transaction.reference !== "capture" &&
      transaction.reference !== "refund"
    ) {
      return acc
    }
    if (
      referenceIds &&
      (!transaction.reference_id || !referenceIds.has(transaction.reference_id))
    ) {
      return acc
    }
    return MathBN.add(acc, transaction.raw_amount ?? transaction.amount ?? 0)
  }, MathBN.convert(0))
}
