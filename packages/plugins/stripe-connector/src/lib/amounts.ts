import { BigNumberInput } from "@medusajs/framework/types"
import { BigNumber, MathBN } from "@medusajs/framework/utils"

function getCurrencyMultiplier(currency: string): number {
  const multipliers: Record<number, string[]> = {
    0: ["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"],
    3: ["BHD", "IQD", "JOD", "KWD", "OMR", "TND"],
  }
  const code = currency.toUpperCase()
  let power = 2
  for (const [key, list] of Object.entries(multipliers)) {
    if (list.includes(code)) {
      power = parseInt(key, 10)
      break
    }
  }
  return Math.pow(10, power)
}

/** Converts a major-unit amount to Stripe's smallest unit (https://docs.stripe.com/currencies). */
export function getSmallestUnit(amount: BigNumberInput, currency: string): number {
  const multiplier = getCurrencyMultiplier(currency)
  const rounded = Math.round(new BigNumber(MathBN.mult(amount, multiplier)).numeric) / multiplier
  const smallest = new BigNumber(MathBN.mult(rounded, multiplier))
  let numeric = smallest.numeric
  if (multiplier === 1e3) {
    numeric = Math.ceil(numeric / 10) * 10
  }
  return parseInt(numeric.toString().split(".").shift()!, 10)
}

/** Converts a smallest-unit amount back to the major unit. */
export function getAmountFromSmallestUnit(amount: BigNumberInput, currency: string): number {
  const multiplier = getCurrencyMultiplier(currency)
  return new BigNumber(MathBN.div(amount, multiplier)).numeric
}
