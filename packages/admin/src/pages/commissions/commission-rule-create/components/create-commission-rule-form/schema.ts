import i18n from "i18next";
import * as zod from "zod";

import { SCOPE_TYPE_DIMENSIONS } from "../../../common/types";

export const CreateCommissionRuleSchema = zod
  .object({
    title: zod
      .string()
      .min(1, { message: i18n.t("commissions.create.validation.titleRequired") }),
    code: zod
      .string()
      .min(1, { message: i18n.t("commissions.create.validation.codeRequired") }),
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
    value: zod.coerce.number().optional(),
    fixed_values: zod.record(zod.string(), zod.coerce.number()).optional(),
    include_tax: zod.boolean(),
    include_shipping: zod.boolean(),
  })
  .superRefine((data, ctx) => {
    const dimensions = SCOPE_TYPE_DIMENSIONS[data.scopeType];

    if (dimensions.includes("seller") && data.stores.length === 0) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["stores"],
        message: i18n.t("commissions.create.validation.storesRequired"),
      });
    }
    if (dimensions.includes("product_type") && data.productTypes.length === 0) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["productTypes"],
        message: i18n.t("commissions.create.validation.productTypesRequired"),
      });
    }
    if (
      dimensions.includes("product_category") &&
      data.categories.length === 0
    ) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["categories"],
        message: i18n.t("commissions.create.validation.categoriesRequired"),
      });
    }
    if (
      data.commissionType === "percentage" &&
      (data.value === undefined || Number.isNaN(data.value))
    ) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["value"],
        message: i18n.t("commissions.create.validation.valueRequired"),
      });
    }
  });

export type CreateCommissionRuleSchemaType = zod.infer<
  typeof CreateCommissionRuleSchema
>;
