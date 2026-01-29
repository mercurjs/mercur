import { t } from "i18next"
import { z } from "zod"
import { castNumber } from "../../../lib/cast-number"

export const ConditionalPriceSchema = z
  .object({
    amount: z.union([z.string(), z.number()]),
    gte: z.union([z.string(), z.number()]).nullish(),
    lte: z.union([z.string(), z.number()]).nullish(),
    lt: z.number().nullish(),
    gt: z.number().nullish(),
    eq: z.number().nullish(),
  })
  .refine((data) => data.amount !== "", {
    message: t(
      "stockLocations.shippingOptions.conditionalPrices.errors.amountRequired"
    ),
    path: ["amount"],
  })
  .refine(
    (data) => {
      const hasEqLtGt =
        data.eq !== undefined || data.lt !== undefined || data.gt !== undefined

      // The rule has operators that can only be managed using the API, so we should not validate this.
      if (hasEqLtGt) {
        return true
      }

      return (
        (data.gte !== undefined && data.gte !== "") ||
        (data.lte !== undefined && data.lte !== "")
      )
    },
    {
      message: t(
        "stockLocations.shippingOptions.conditionalPrices.errors.minOrMaxRequired"
      ),
      path: ["gte"],
    }
  )
  .refine(
    (data) => {
      if (
        data.gte != null &&
        data.gte !== "" &&
        data.lte != null &&
        data.lte !== ""
      ) {
        const gte = castNumber(data.gte)
        const lte = castNumber(data.lte)
        return gte <= lte
      }
      return true
    },
    {
      message: t(
        "stockLocations.shippingOptions.conditionalPrices.errors.minGreaterThanMax"
      ),
      path: ["gte"],
    }
  )

export type ConditionalPrice = z.infer<typeof ConditionalPriceSchema>

export const UpdateConditionalPriceSchema = ConditionalPriceSchema.and(
  z.object({
    id: z.string().optional(),
  })
)

export type UpdateConditionalPrice = z.infer<
  typeof UpdateConditionalPriceSchema
>

function refineDuplicates(
  data: {
    prices: {
      amount: string | number
      gte?: string | number | null | undefined
      lte?: string | number | null | undefined
      lt?: number | null | undefined
      gt?: number | null | undefined
      eq?: number | null | undefined
    }[]
  },
  ctx: z.RefinementCtx
) {
  const prices = data.prices

  for (let i = 0; i < prices.length; i++) {
    for (let j = i + 1; j < prices.length; j++) {
      const price1 = prices[i]
      const price2 = prices[j]

      if (price1.amount === "" || price2.amount === "") {
        continue
      }

      const price1Amount = castNumber(price1.amount)
      const price2Amount = castNumber(price2.amount)

      if (price1Amount === price2Amount) {
        addDuplicateAmountError(ctx, j)
      }

      // Then check conditions separately
      const conditions = [
        { value: price1.gte, type: "gte" },
        { value: price1.lte, type: "lte" },
        { value: price1.eq, type: "eq" },
        { value: price1.lt, type: "lt" },
        { value: price1.gt, type: "gt" },
      ] as const

      conditions.forEach((condition1) => {
        if (!condition1.value && condition1.value !== 0) {
          return
        }

        const conditions2 = [
          { value: price2.gte, type: "gte" },
          { value: price2.lte, type: "lte" },
          { value: price2.eq, type: "eq" },
          { value: price2.lt, type: "lt" },
          { value: price2.gt, type: "gt" },
        ] as const

        conditions2.forEach((condition2) => {
          if (!condition2.value && condition2.value !== 0) {
            return
          }

          const condition1Value = castNumber(
            condition1.value as string | number
          )
          const condition2Value = castNumber(
            condition2.value as string | number
          )

          if (condition1Value === condition2Value) {
            addOverlappingConditionError(ctx, j, condition2.type)
          }
        })
      })
    }
  }
}

export const CondtionalPriceRuleSchema = z
  .object({
    prices: z.array(ConditionalPriceSchema),
  })
  .superRefine(refineDuplicates)

export type CondtionalPriceRuleSchemaType = z.infer<
  typeof CondtionalPriceRuleSchema
>

export const UpdateConditionalPriceRuleSchema = z
  .object({
    prices: z.array(UpdateConditionalPriceSchema),
  })
  .superRefine(refineDuplicates)

export type UpdateConditionalPriceRuleSchemaType = z.infer<
  typeof UpdateConditionalPriceRuleSchema
>

const addDuplicateAmountError = (ctx: z.RefinementCtx, index: number) => {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: t(
      "stockLocations.shippingOptions.conditionalPrices.errors.duplicateAmount"
    ),
    path: ["prices", index, "amount"],
  })
}

const addOverlappingConditionError = (
  ctx: z.RefinementCtx,
  index: number,
  type: "gte" | "lte" | "eq" | "lt" | "gt"
) => {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: t(
      "stockLocations.shippingOptions.conditionalPrices.errors.overlappingConditions"
    ),
    path: ["prices", index, type],
  })
}
