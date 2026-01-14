import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";

import { listFilteredProductVariantsWorkflow } from "../../../../workflows/product-variants";
import type { AdminGetProductVariantsParamsType } from "./validators";

/**
 * @oas [get] /admin/custom/product-variants
 * operationId: "AdminListProductVariantsFiltered"
 * summary: "List Product Variants (Filtered)"
 * description: "Retrieves a filtered list of product variants with advanced filtering options (seller, price, inventory)."
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
 *   - name: seller_id
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter by seller ID.
 *   - name: has_price
 *     in: query
 *     schema:
 *       type: boolean
 *     required: false
 *     description: Filter variants that have prices.
 *   - name: has_inventory
 *     in: query
 *     schema:
 *       type: boolean
 *     required: false
 *     description: Filter variants that have inventory items.
 *   - name: q
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Search query for variant title or SKU.
 *   - name: order
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: The order of the returned items.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             variants:
 *               type: array
 *               description: Array of product variants.
 *               items:
 *                 type: object
 *                 description: Product variant object with details.
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
 *   - Admin Product Variants
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: MedusaRequest<AdminGetProductVariantsParamsType>,
  res: MedusaResponse
) => {
  const { seller_id, has_price, has_inventory, q } =
    req.filterableFields as AdminGetProductVariantsParamsType;

  const { result } = await listFilteredProductVariantsWorkflow(req.scope).run({
    input: {
      seller_id,
      has_price,
      has_inventory,
      q,
      fields: req.queryConfig.fields,
      pagination: req.queryConfig.pagination,
    },
  });

  res.json(result);
};
