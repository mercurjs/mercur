import * as zod from "zod";

export const CreateCommissionRuleSchema = zod.object({
  title: zod.string().min(1),
  code: zod.string().min(1),
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
  value: zod.coerce.number().min(0),
  fixed_values: zod.record(zod.string(), zod.coerce.number()).optional(),
  include_tax: zod.boolean(),
  include_shipping: zod.boolean(),
});

export type CreateCommissionRuleSchemaType = zod.infer<
  typeof CreateCommissionRuleSchema
>;
