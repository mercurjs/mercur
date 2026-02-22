import { addOrRemoveCampaignPromotionsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  VendorAssignCampaignPromotionsType,
  VendorGetCampaignsParamsType,
} from "../../validators"

/**
 * @oas [post] /vendor/campaigns/{id}/promotions
 * operationId: "VendorAssignCampaignPromotions"
 * summary: "Assign promotions to campaign"
 * description: "Adds or removes promotions from a campaign for the authenticated vendor. The campaign and all promotions must belong to the vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the campaign.
 *     schema:
 *       type: string
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           add:
 *             type: array
 *             items:
 *               type: string
 *             description: Array of promotion IDs to add to the campaign.
 *           remove:
 *             type: array
 *             items:
 *               type: string
 *             description: Array of promotion IDs to remove from the campaign.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             campaign:
 *               $ref: "#/components/schemas/VendorCampaign"
 * tags:
 *   - Vendor Campaigns
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<
    VendorAssignCampaignPromotionsType,
    VendorGetCampaignsParamsType
  >,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params
  const { add = [], remove = [] } = req.validatedBody

  await addOrRemoveCampaignPromotionsWorkflow(req.scope).run({
    input: { id, add, remove },
  })

  const {
    data: [campaign],
  } = await query.graph({
    entity: "campaign",
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id,
    },
  })

  res.status(200).json({ campaign })
}