import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

import { filterAndListOrderSetsWorkflow } from "../../../workflows/order-set/workflows";

/**
 * @oas [get] /admin/order-sets
 * operationId: "AdminListOrderSets"
 * summary: "List Order Sets"
 * description: "Retrieves a list of order sets with optional filtering and search."
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
 *   - name: order_id
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter order sets by a specific order ID.
 *   - name: q
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Search query to filter order sets by Vendor name, Customer email/name, Group ID (display_id), or Order ID.
 *   - name: seller_id
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter order sets by seller ID(s).
 *   - name: payment_status
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter order sets by payment status(es).
 *   - name: fulfillment_status
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter order sets by fulfillment status(es).
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             order_sets:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/AdminOrderSet"
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
 *   - Admin Order Sets
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { filterableFields, queryConfig } = req;

  const { result } = await filterAndListOrderSetsWorkflow(req.scope).run({
    input: {
      filters: filterableFields,
      fields: queryConfig.fields,
      pagination: queryConfig.pagination,
    },
  });

  res.json({
    order_sets: result!.data,
    count: result!.metadata!.count,
    offset: result!.metadata!.skip,
    limit: result!.metadata!.take,
  });
};
