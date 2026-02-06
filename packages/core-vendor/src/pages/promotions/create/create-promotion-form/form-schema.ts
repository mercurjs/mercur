import { z } from "zod"
import { CreateCampaignSchema } from "@pages/campaigns/create/create-campaign-form/create-campaign-form"

const RuleSchema = z.array(
  z.object({
    id: z.string().optional(),
    attribute: z.string().min(1, { message: "Required field" }),
    operator: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.enum(["gt", "lt", "eq", "ne", "in", "lte", "gte"], {
        required_error: "Required field",
        invalid_type_error: "Required field",
      })
    ),
    values: z.union([
      z.number().min(1, { message: "Required field" }),
      z.string().min(1, { message: "Required field" }),
      z.array(z.string()).min(1, { message: "Required field" }),
    ]),
    required: z.boolean().optional(),
    disguised: z.boolean().optional(),
    field_type: z.string().optional(),
  })
)

export const CreatePromotionSchema = z
  .object({
    template_id: z.string().optional(),
    campaign_id: z.string().optional(),
    campaign_choice: z.enum(["none", "existing", "new"]).optional(),
    is_automatic: z.string().toLowerCase(),
    code: z.string().min(1),
    type: z.enum(["buyget", "standard"]),
    status: z.enum(["draft", "active", "inactive"]),
    rules: RuleSchema,
    application_method: z.object({
      allocation: z.enum(["each", "across"]),
      value: z.number().min(0),
      currency_code: z.string().optional(),
      max_quantity: z.number().optional().nullable(),
      target_rules: RuleSchema,
      buy_rules: RuleSchema,
      type: z.enum(["fixed", "percentage"]),
      target_type: z.enum(["order", "shipping_methods", "items"]),
    }),
    campaign: CreateCampaignSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.application_method.allocation === "across") {
        return true
      }

      return (
        data.application_method.allocation === "each" &&
        typeof data.application_method.max_quantity === "number"
      )
    },
    {
      path: ["application_method.max_quantity"],
      message: `required field`,
    }
  )

export type CreatePromotionSchemaType = z.infer<typeof CreatePromotionSchema>
