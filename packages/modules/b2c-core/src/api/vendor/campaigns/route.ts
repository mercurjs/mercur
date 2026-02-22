import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { fetchSellerByAuthActorId } from "@mercurjs/framework";
import sellerCampaign from "../../../links/seller-campaign";
import { createVendorCampaignWorkflow } from "../../../workflows/campaigns/workflows";
import {
  VendorCreateCampaignType,
  VendorGetCampaignsParamsType,
} from "./validators";

/**
 * @oas [get] /vendor/campaigns
 * operationId: "VendorListCampaigns"
 * summary: "List Campaigns"
 * description: "Retrieves a list of campaigns for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - name: q
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Search query to filter campaigns by name (case-insensitive).
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
  req: AuthenticatedMedusaRequest<{}, VendorGetCampaignsParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const searchQuery = req.validatedQuery.q;

  const {
    q: _,
    seller_id,
    ...filterableFields
  } = req.filterableFields as Record<string, unknown>;

  const { data: sellerCampaigns } = await query.graph({
    entity: sellerCampaign.entryPoint,
    fields: ["campaign_id"],
    filters: {
      seller_id,
      deleted_at: { $eq: null },
    },
  });

  const campaignIds = sellerCampaigns.map((rel) => rel.campaign_id);

  if (campaignIds.length === 0) {
    return res.json({
      campaigns: [],
      count: 0,
      offset: req.queryConfig.pagination?.skip ?? 0,
      limit: req.queryConfig.pagination?.take ?? 50,
    });
  }

  const campaignFilters: Record<string, unknown> = {
    ...filterableFields,
    id: campaignIds,
    deleted_at: { $eq: null },
  };

  if (searchQuery) {
    campaignFilters.name = { $ilike: `%${searchQuery}%` };
  }

  const { data: campaigns, metadata } = await query.graph({
    entity: "campaign",
    fields: req.queryConfig.fields,
    filters: campaignFilters,
    pagination: req.queryConfig.pagination,
  });

  res.json({
    campaigns,
    count: metadata?.count ?? campaigns.length,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 50,
  });
};

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
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const seller = await fetchSellerByAuthActorId(
    req.auth_context?.actor_id,
    req.scope
  );

  const { result } = await createVendorCampaignWorkflow.run({
    container: req.scope,
    input: { campaign: req.validatedBody, seller_id: seller.id },
  });

  const {
    data: [campaign],
  } = await query.graph({
    entity: "campaign",
    fields: req.queryConfig.fields,
    filters: {
      id: result[0].id,
    },
  });

  res.status(201).json({ campaign });
};
