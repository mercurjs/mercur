import {
    AuthenticatedMedusaRequest,
    MedusaResponse,
  } from "@medusajs/framework/http"
  
  import { addOrRemoveCampaignPromotionsWorkflow } from "@medusajs/core-flows"
  import { LinkMethodRequest } from "@medusajs/framework/types"
  import { refetchCampaign } from "@medusajs/medusa/api/admin/campaigns/helpers"
  
/**
 * @oas [post] /vendor/campaigns/{id}/promotions
 * operationId: VendorPostCampaignsIdPromotions
 * summary: Manage the Promotions of a Campaign
 * description: Manage the promotions of a campaign, either by adding them or removing them from the campaign.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The campaign's ID.
 *     required: true
 *     schema:
 *       type: string
 *   - name: fields
 *     in: query
 *     description: Comma-separated fields that should be included in the returned data. if a field is prefixed with `+` it will be added to the default fields, using `-` will remove it from the default
 *       fields. without prefix it will replace the entire default fields.
 *     required: false
 *     schema:
 *       type: string
 *       title: fields
 *       description: Comma-separated fields that should be included in the returned data. if a field is prefixed with `+` it will be added to the default fields, using `-` will remove it from the default
 *         fields. without prefix it will replace the entire default fields.
 *       externalDocs:
 *         url: "#select-fields-and-relations"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         description: The promotions to add or remove from the campaign.
 *         properties:
 *           add:
 *             type: array
 *             description: The promotions to add to the campaign.
 *             items:
 *               type: string
 *               title: add
 *               description: A promotion's ID.
 *           remove:
 *             type: array
 *             description: The promotions to remove from the campaign.
 *             items:
 *               type: string
 *               title: remove
 *               description: A promotion's ID.
 * tags:
 *   - Vendor Campaigns
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/VendorCampaign"
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 * 
*/

  export const POST = async (
    req: AuthenticatedMedusaRequest<LinkMethodRequest>,
    res: MedusaResponse
  ) => {
    const { id } = req.params
    const { add, remove } = req.validatedBody
    await addOrRemoveCampaignPromotionsWorkflow(req.scope).run({
      input: { id, add, remove },
    })
  
    const campaign = await refetchCampaign(
      req.params.id,
      req.scope,
      req.queryConfig.fields
    )
  
    res.status(200).json({ campaign })
  }