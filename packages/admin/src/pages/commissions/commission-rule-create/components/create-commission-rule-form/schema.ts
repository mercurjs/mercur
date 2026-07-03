import i18n from "i18next";
import * as zod from "zod";

import { addCommissionValueIssues, optionalAmount } from "../../../common/schema";
import { SCOPE_TYPE_DIMENSIONS } from "../../../common/types";

const baseCommissionRuleSchema = zod.object({
  title: zod
    .string()
    .min(1, { message: i18n.t("commissions.validation.titleRequired") }),
  code: zod
    .string()
    .min(1, { message: i18n.t("commissions.validation.codeRequired") }),
  scopeType: zod.enum([
    "store",
    "product_type",
    "category",
    "store_product_type",
    "store_category",
  ]),
  stores: zod.array(zod.string()),
  productTypes: zod.array(zod.string()),
  categories: zod.array(zod.string()),
  commissionType: zod.enum(["percentage", "fixed"]),
  value: optionalAmount,
  fixed_values: zod.record(zod.string(), optionalAmount).optional(),
  include_tax: zod.boolean(),
  include_shipping: zod.boolean(),
});

export const createCommissionRuleSchema = (currencies: string[] = []) =>
  baseCommissionRuleSchema.superRefine((data, ctx) => {
    const dimensions = SCOPE_TYPE_DIMENSIONS[data.scopeType];

    if (dimensions.includes("seller") && data.stores.length === 0) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["stores"],
        message: i18n.t("commissions.validation.storesRequired"),
      });
    }
    if (dimensions.includes("product_type") && data.productTypes.length === 0) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["productTypes"],
        message: i18n.t("commissions.validation.productTypesRequired"),
      });
    }
    if (
      dimensions.includes("product_category") &&
      data.categories.length === 0
    ) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["categories"],
        message: i18n.t("commissions.validation.categoriesRequired"),
      });
    }

    addCommissionValueIssues(ctx, {
      type: data.commissionType,
      value: data.value,
      fixedValues: data.fixed_values,
      currencies,
    });
  });

export type CreateCommissionRuleSchemaType = zod.infer<
  typeof baseCommissionRuleSchema
>;
