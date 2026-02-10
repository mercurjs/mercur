import { CampaignBudgetType, isPresent } from "@medusajs/framework/utils"
import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export const VendorGetCampaignParams = createSelectParams()

export const VendorGetCampaignsParamsFields = z
  .object({
    q: z.string().optional(),
    campaign_identifier: z.string().optional(),
    budget: z
      .object({
        currency_code: z.string().optional(),
      })
      .optional(),
  })
  .strict()

export type VendorGetCampaignsParamsType = z.infer<
  typeof VendorGetCampaignsParams
>
export const VendorGetCampaignsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(VendorGetCampaignsParamsFields)

const VendorCreateCampaignBudget = z
  .object({
    type: z.nativeEnum(CampaignBudgetType),
    limit: z.number().nullish(),
    currency_code: z.string().nullish(),
    attribute: z.string().nullish(),
  })
  .strict()
  .refine(
    (data) =>
      data.type !== CampaignBudgetType.SPEND || isPresent(data.currency_code),
    {
      path: ["currency_code"],
      message: `currency_code is required when budget type is ${CampaignBudgetType.SPEND}`,
    }
  )
  .refine(
    (data) =>
      data.type !== CampaignBudgetType.USAGE || !isPresent(data.currency_code),
    {
      path: ["currency_code"],
      message: `currency_code should not be present when budget type is ${CampaignBudgetType.USAGE}`,
    }
  )
  .refine(
    (data) =>
      isPresent(data.attribute) ||
      ![
        CampaignBudgetType.USE_BY_ATTRIBUTE,
        CampaignBudgetType.SPEND_BY_ATTRIBUTE,
      ].includes(data.type),
    (data) => ({
      path: ["attribute"],
      message: `campaign budget attribute is required when budget type is ${data.type}`,
    })
  )

export const VendorUpdateCampaignBudget = z
  .object({
    limit: z.number().nullish(),
  })
  .strict()

export type VendorCreateCampaignType = z.infer<typeof VendorCreateCampaign>
export const VendorCreateCampaign = z
  .object({
    name: z.string(),
    campaign_identifier: z.string(),
    description: z.string().nullish(),
    budget: VendorCreateCampaignBudget.nullish(),
    starts_at: z.coerce.date().nullish(),
    ends_at: z.coerce.date().nullish(),
  })
  .strict()

export type VendorUpdateCampaignType = z.infer<typeof VendorUpdateCampaign>
export const VendorUpdateCampaign = z.object({
  name: z.string().optional(),
  campaign_identifier: z.string().optional(),
  description: z.string().nullish(),
  budget: VendorUpdateCampaignBudget.optional(),
  starts_at: z.coerce.date().nullish(),
  ends_at: z.coerce.date().nullish(),
})
