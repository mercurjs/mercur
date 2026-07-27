import i18n from "i18next"
import { z } from "zod"
import { CreateCampaignSchema } from "../../../../campaigns/campaign-create/components/create-campaign-form"

const RuleSchema = z.array(
  z.object({
    id: z.string().optional(),
    attribute: z.string().min(1, { message: i18n.t("validation.requiredField") }),
    operator: z.string().min(1, { message: i18n.t("validation.requiredField") }),
    values: z.union([
      z.number().min(1, { message: i18n.t("validation.requiredField") }),
      z.string().min(1, { message: i18n.t("validation.requiredField") }),
      z.array(z.string()).min(1, { message: i18n.t("validation.requiredField") }),
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
    is_tax_inclusive: z.boolean().optional(),
    seller_id: z.string().optional(),
    limit: z.number().int().min(1).nullable().optional(),
    cost_bearer: z.enum(["store", "marketplace", "shared"]),
    shared_marketplace_percentage: z.number().min(0).max(100).nullable(),
    application_method: z.object({
      allocation: z.enum(["each", "across", "once"]),
      value: z.number().min(0).or(z.string().min(1)),
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

      return typeof data.application_method.max_quantity === "number"
    },
    {
      path: ["application_method.max_quantity"],
      message: i18n.t("validation.requiredField"),
    }
  )
  .refine(
    (data) => {
      if (data.cost_bearer !== "shared") {
        return true
      }

      return typeof data.shared_marketplace_percentage === "number"
    },
    {
      path: ["shared_marketplace_percentage"],
      message: i18n.t("validation.requiredField"),
    }
  )
  .refine(
    (data) => {
      if (data.type !== "buyget") {
        return true
      }

      return !!data.seller_id
    },
    {
      path: ["seller_id"],
      message: i18n.t("promotions.form.storeOffers.required"),
    }
  )

export type CreatePromotionSchemaType = z.infer<typeof CreatePromotionSchema>
