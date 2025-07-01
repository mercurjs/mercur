import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerCampaign from '../../../links/seller-campaign'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { createVendorCampaignWorkflow } from '../../../workflows/campaigns/workflows'
import { VendorCreateCampaignType } from './validators'

/**
 * @oas [get] /vendor/campaigns
 * operationId: "VendorListCampaigns"
 * summary: "List Campaigns"
 * description: "Retrieves a list of campaigns for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - name: offset
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to skip before starting to collect the result set.
 *   - name: limit
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to return.
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             campaigns:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorCampaign"
 *             count:
 *               type: integer
 *               description: The total number of items available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 * tags:
 *   - Vendor Campaigns
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: relations, metadata } = await query.graph({
    entity: sellerCampaign.entryPoint,
    fields: req.queryConfig.fields.map((field) => `campaign.${field}`),
    filters: {
      ...req.filterableFields,
      deleted_at: {
        $eq: null
      }
    },
    pagination: req.queryConfig.pagination
  })

  const activeCampaigns = relations
    .map((relation) => relation.campaign)
    .filter((campaign) => !!campaign)

  res.json({
    campaigns: activeCampaigns,
    count: activeCampaigns.length,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}

/**
 * @oas [post] /vendor/campaigns
 * operationId: "VendorCreateCampaign"
 * summary: "Create campaign"
 * description: "Creates a new campaign for the authenticated vendor."
 * x-authenticated: true
 * parameters:
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
 *         $ref: "#/components/schemas/VendorCreateCampaign"
 * responses:
 *   "201":
 *     description: Created
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
  req: AuthenticatedMedusaRequest<VendorCreateCampaignType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const seller = await fetchSellerByAuthActorId(
    req.auth_context?.actor_id,
    req.scope
  )

  const { result } = await createVendorCampaignWorkflow.run({
    container: req.scope,
    input: { campaign: req.validatedBody, seller_id: seller.id }
  })

  const {
    data: [campaign]
  } = await query.graph({
    entity: 'campaign',
    fields: req.queryConfig.fields,
    filters: {
      id: result[0].id
    }
  })

  res.status(201).json({ campaign })
}
