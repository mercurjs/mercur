import { BigNumberInput } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"

import {
    allocateProportionally,
    getCurrencyDecimalDigits,
} from "../../payment/utils/split-order-payment"

type CartCreditLine = {
    id: string
    amount: BigNumberInput
    raw_amount?: BigNumberInput | null
    reference?: string | null
    reference_id?: string | null
    metadata?: Record<string, unknown> | null
}

export type AllocatedCreditLine = {
    amount: BigNumberInput
    reference?: string | null
    reference_id?: string | null
    metadata: Record<string, unknown>
}

/**
 * Splits a cart's credit lines across its orders by their totals before credit.
 * Each line is weighted by what the earlier lines left of each order, so lines
 * that together cover the cart settle every order rather than leaving rounding
 * behind on one and overpaying another.
 */
export const allocateCreditLines = ({
    credit_lines,
    order_totals,
    currency_code,
}: {
    credit_lines: CartCreditLine[]
    order_totals: BigNumberInput[]
    currency_code?: string | null
}): AllocatedCreditLine[][] => {
    const decimalDigits = getCurrencyDecimalDigits(currency_code)
    const remaining = [...order_totals]
    const allocated: AllocatedCreditLine[][] = order_totals.map(() => [])

    for (const creditLine of credit_lines) {
        const shares = allocateProportionally({
            amount: creditLine.raw_amount ?? creditLine.amount,
            weights: remaining,
            decimalDigits,
        })

        shares.forEach((share, index) => {
            remaining[index] = MathBN.sub(remaining[index], share)

            if (MathBN.eq(share, 0)) {
                return
            }

            allocated[index].push({
                amount: share,
                reference: creditLine.reference,
                reference_id: creditLine.reference_id,
                metadata: {
                    ...creditLine.metadata,
                    cart_credit_line_id: creditLine.id,
                },
            })
        })
    }

    return allocated
}
