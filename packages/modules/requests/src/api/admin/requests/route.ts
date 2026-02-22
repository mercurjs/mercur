import { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

import { getRequestIdsForAdminList } from './utils';
import type { AdminGetRequestsParamsType } from './validators';

/**
 * @oas [get] /admin/requests
 * operationId: "AdminListRequests"
 * summary: "List requests"
 * description: "Retrieves requests list with optional sorting, filtering and search."
 * x-authenticated: true
 * parameters:
 *   - in: query
 *     name: limit
 *     schema:
 *       type: number
 *     description: The number of items to return. Default 50.
 *   - in: query
 *     name: offset
 *     schema:
 *       type: number
 *     description: The number of items to skip before starting the response. Default 0.
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 *   - name: type
 *     in: query
 *     schema:
 *       type: string
 *       enum: [product,product_collection,product_collection_update,product_category,seller,review_remove,product_type,product_tag,product_update]
 *     required: false
 *     description: Filter by request type
 *   - name: status
 *     in: query
 *     schema:
 *       type: string
 *       enum: [pending,rejected,accepted]
 *     required: false
 *     description: Filter by request status
 *   - name: order
 *     in: query
 *     schema:
 *       type: string
 *       enum: [created_at,-created_at,updated_at,-updated_at]
 *     required: false
 *     description: Sort by created_at or updated_at. Prefix with - for descending. Default -created_at.
 *   - name: seller_id
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter by vendor (seller) ID.
 *   - name: created_at
 *     in: query
 *     schema:
 *       type: object
 *       description: Date filter. Pass JSON object with operators e.g. {"$gte":"2024-01-01","$lte":"2024-12-31"}
 *       properties:
 *         $gte: { type: string }
 *         $lte: { type: string }
 *         $gt: { type: string }
 *         $lt: { type: string }
 *         $eq: { type: string }
 *         $ne: { type: string }
 *     required: false
 *   - name: q
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Search by vendor name and/or product name (title in request data).
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             requests:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/AdminRequest"
 *             count:
 *               type: integer
 *               description: The total number of requests
 *             offset:
 *               type: integer
 *               description: The number of requests skipped
 *             limit:
 *               type: integer
 *               description: The number of requests per page
 * tags:
 *   - Admin Requests
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const filterableFields = { ...req.filterableFields };
  const validatedQuery = req.validatedQuery as AdminGetRequestsParamsType;

  const requestIds = await getRequestIdsForAdminList(req.scope, {
    seller_id:
      typeof filterableFields.seller_id === 'string'
        ? filterableFields.seller_id
        : undefined,
    q: validatedQuery?.q?.trim()
  });

  delete filterableFields.seller_id;
  if (requestIds !== null) {
    const filters = filterableFields as Record<string, unknown>;
    filters.id = requestIds.length > 0 ? requestIds : 'no-match';
  }

  const { data: requests, metadata } = await query.graph({
    entity: 'request',
    fields: req.queryConfig.fields,
    filters: {
      ...filterableFields,
      status: filterableFields.status ?? { $ne: 'draft' }
    },
    pagination: req.queryConfig.pagination
  });

  res.json({
    requests,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  });
}
