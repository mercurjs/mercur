import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  deleteCampaignsWorkflow,
  updateCampaignsWorkflow
} from '@medusajs/medusa/core-flows'

import { getFilteredCampaignPromotions } from '../helpers'
import {
  VendorGetCampaignByIdParamsType,
  VendorUpdateCampaignType
} from '../validators'

/**
 * @oas [get] /vendor/campaigns/{id}
 * operationId: "VendorGetCampaignById"
 * summary: "Get campaign"
 * description: "Retrieves campaign by id for the authenticated vendor. Supports filtering, searching, and sorting of associated promotions."
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
 *     description: Comma-separated fields to include in the response. Use `*promotions` or `promotions.*` to include promotions.
 *     example: "*promotions"
 *   - name: q
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Search query to filter promotions by code (case-insensitive partial match).
 *     example: "test"
 *   - name: created_at
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: |
 *       Filter promotions by created_at date. Must be a JSON object (URL-encoded) with comparison operators.
 *       Supported operators: `$gte`, `$lte`, `$gt`, `$lt`, `$eq`, `$ne`.
 *       Example: `{"$gte":"2025-11-19T11:00:00.000Z"}` (URL-encoded: `%7B%22%24gte%22%3A%222025-11-19T11%3A00%3A00.000Z%22%7D`)
 *     example: '{"$gte":"2025-11-19T11:00:00.000Z"}'
 *   - name: updated_at
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: |
 *       Filter promotions by updated_at date. Must be a JSON object (URL-encoded) with comparison operators.
 *       Supported operators: `$gte`, `$lte`, `$gt`, `$lt`, `$eq`, `$ne`.
 *       Example: `{"$gte":"2025-11-19T11:00:00.000Z"}` (URL-encoded: `%7B%22%24gte%22%3A%222025-11-19T11%3A00%3A00.000Z%22%7D`)
 *     example: '{"$gte":"2025-11-19T11:00:00.000Z"}'
 *   - name: order
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: |
 *       Sort promotions by property. Prefix with `-` for descending order.
 *       Examples: `code`, `-code`, `created_at`, `-created_at`, `updated_at`, `-updated_at`
 *     example: "-code"
 *   - name: offset
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of promotions to skip before starting to collect the result set.
 *     example: 0
 *   - name: limit
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of promotions to return.
 *     example: 50
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
export const GET = async (
  req: AuthenticatedMedusaRequest<{}, VendorGetCampaignByIdParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [campaign]
  } = await query.graph({
    entity: 'campaign',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  if (campaign) {
    const promotions = await getFilteredCampaignPromotions(
      req.scope,
      req.params.id,
      req.validatedQuery,
      req.queryConfig.fields || [],
      req.queryConfig.pagination
    )

    campaign.promotions = promotions ?? []
  }

  res.json({ campaign })
}

/**
 * @oas [delete] /vendor/campaigns/{id}
 * operationId: "VendorDeleteCampaignById"
 * summary: "Delete campaign"
 * description: "Deletes campaign by id for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the campaign.
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The ID of the deleted campaign.
 *             object:
 *               type: string
 *               description: The type of the object that was deleted
 *             deleted:
 *               type: boolean
 *               description: Whether or not the items were deleted
 * tags:
 *   - Vendor Campaigns
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteCampaignsWorkflow.run({
    container: req.scope,
    input: { ids: [id] }
  })

  res.json({ id, object: 'campaign', deleted: true })
}

/**
 * @oas [post] /vendor/campaigns/{id}
 * operationId: "VendorUpdateCampaignById"
 * summary: "Update campaign"
 * description: "Updates campaign by id for the authenticated vendor."
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
 *         $ref: "#/components/schemas/VendorUpdateCampaign"
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
  req: AuthenticatedMedusaRequest<VendorUpdateCampaignType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateCampaignsWorkflow.run({
    container: req.scope,
    input: {
      campaignsData: [
        {
          id: req.params.id,
          ...req.validatedBody
        }
      ]
    }
  })

  const {
    data: [campaign]
  } = await query.graph({
    entity: 'campaign',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({ campaign })
}
