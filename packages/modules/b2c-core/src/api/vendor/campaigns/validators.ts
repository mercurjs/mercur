import { z } from "zod";

import { CampaignBudgetType, isPresent } from "@medusajs/framework/utils";
import { createFindParams, createLinkBody } from "@medusajs/medusa/api/utils/validators";
import { dateFilterSchema } from "../../../shared/infra/http/utils";


export const VendorGetCampaignsParamsFields = z.object({
  q: z.string().optional(),
});

export type VendorGetCampaignsParamsType = z.infer<
  typeof VendorGetCampaignsParams
>;
export const VendorGetCampaignsParams = createFindParams({
  limit: 50,
  offset: 0,
}).merge(VendorGetCampaignsParamsFields);

export const VendorGetCampaignByIdParamsFields = z.object({
  q: z.string().optional(),
  created_at: dateFilterSchema,
  updated_at: dateFilterSchema,
});

export type VendorGetCampaignByIdParamsType = z.infer<
  typeof VendorGetCampaignByIdParams
>;
export const VendorGetCampaignByIdParams = createFindParams({
  limit: 50,
  offset: 0,
})
  .merge(VendorGetCampaignByIdParamsFields)
  .strict();

export const VendorAssignCampaignPromotions = createLinkBody();

export type VendorAssignCampaignPromotionsType = z.infer<
  typeof VendorAssignCampaignPromotions
>;

/**
 * @schema VendorCreateCampaignBudget
 * type: object
 * properties:
 *   type:
 *     type: string
 *     enum: [spend,usage]
 *     description: The budget's type.
 *   limit:
 *     type: number
 *     description: The buget's limit.
 *   currency_code:
 *     type: string
 *     description: The budget's currency_code.
 */
export const VendorCreateCampaignBudget = z
  .object({
    type: z.nativeEnum(CampaignBudgetType),
    limit: z.number().nullish(),
    currency_code: z.string().nullish(),
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
  );

/**
 * @schema VendorCreateCampaign
 * type: object
 * properties:
 *   name:
 *     type: string
 *     description: The campaign's name.
 *   campaign_identifier:
 *     type: string
 *     description: The campaign's identifier.
 *   description:
 *     type: string
 *     description: The campaign's description.
 *   starts_at:
 *     type: string
 *     description: The date and time that the campaign starts.
 *   ends_at:
 *     type: string
 *     description: The date and time that the campaign ends.
 *   budget:
 *     $ref: "#/components/schemas/VendorCreateCampaignBudget"
 */
export type VendorCreateCampaignType = z.infer<typeof VendorCreateCampaign>;
export const VendorCreateCampaign = z
  .object({
    name: z.string(),
    campaign_identifier: z.string(),
    description: z.string().nullish(),
    budget: VendorCreateCampaignBudget.nullish(),
    starts_at: z.coerce.date().nullish(),
    ends_at: z.coerce.date().nullish(),
  })
  .strict();

/**
 * @schema VendorUpdateCampaign
 * type: object
 * properties:
 *   name:
 *     type: string
 *     description: The campaign's name.
 *   campaign_identifier:
 *     type: string
 *     description: The campaign's identifier.
 *   description:
 *     type: string
 *     description: The campaign's description.
 *   starts_at:
 *     type: string
 *     description: The date and time that the campaign starts.
 *   ends_at:
 *     type: string
 *     description: The date and time that the campaign ends.
 *   budget:
 *     type: object
 *     properties:
 *       limit:
 *         type: number
 *         description: The buget's limit.
 */
export type VendorUpdateCampaignType = z.infer<typeof VendorUpdateCampaign>;
export const VendorUpdateCampaign = z.object({
  name: z.string().optional(),
  campaign_identifier: z.string().optional(),
  description: z.string().nullish(),
  budget: z
    .object({
      limit: z.number().nullish(),
    })
    .optional(),
  starts_at: z.coerce.date().nullish(),
  ends_at: z.coerce.date().nullish(),
});
