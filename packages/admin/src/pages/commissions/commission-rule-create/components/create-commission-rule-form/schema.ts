import * as zod from "zod";

import { SCOPE_TYPE_DIMENSIONS } from "../../../common/types";

export const CreateCommissionRuleSchema = zod
  .object({
    title: zod.string().min(1, "Please enter a title"),
    code: zod.string().optional(),
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
        message: "Please select at least one store",
      });
    }
    if (dimensions.includes("product_type") && data.productTypes.length === 0) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["productTypes"],
        message: "Please select at least one product type",
      });
    }
    if (
      dimensions.includes("product_category") &&
      data.categories.length === 0
    ) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["categories"],
        message: "Please select at least one category",
      });
    }
    if (
      data.commissionType === "percentage" &&
      (data.value === undefined || Number.isNaN(data.value))
    ) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["value"],
        message: "Please enter a value.",
      });
    }
  });

export type CreateCommissionRuleSchemaType = zod.infer<
  typeof CreateCommissionRuleSchema
>;
