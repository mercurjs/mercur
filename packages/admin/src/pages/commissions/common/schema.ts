import i18n from "i18next";
import * as zod from "zod";

export const optionalAmount = zod.preprocess((val) => {
  if (val === "" || val === null || val === undefined) {
    return undefined;
  }
  const parsed = typeof val === "number" ? val : Number(val);
  return Number.isNaN(parsed) ? undefined : parsed;
}, zod.number().optional());

type CommissionValueInput = {
  type: "percentage" | "fixed";
  value?: number;
  fixedValues?: Record<string, number | undefined>;
  currencies?: string[];
};

export const addCommissionValueIssues = (
  ctx: zod.RefinementCtx,
  { type, value, fixedValues, currencies = [] }: CommissionValueInput
) => {
  if (type === "percentage") {
    if (value === undefined || Number.isNaN(value)) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["value"],
        message: i18n.t("commissions.validation.value"),
      });
    }
    return;
  }

  currencies.forEach((code) => {
    const amount = fixedValues?.[code];
    if (amount === undefined || Number.isNaN(amount)) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["fixed_values", code],
        message: i18n.t("commissions.validation.value"),
      });
    }
  });
};
