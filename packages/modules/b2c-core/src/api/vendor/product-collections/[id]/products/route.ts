import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

import { filterSellerProductsByCollection } from '../../utils';

/**
 * @oas [get] /vendor/product-collections/{id}/products
 * operationId: "VendorListProductCollectionProducts"
 * summary: "List products in collection"
 * description: "Retrieves a list of products belonging to a specific collection for the current seller."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the collection
 *     schema:
 *       type: string
 *   - in: query
 *     name: fields
 *     description: The comma-separated fields to include in the response
 *     schema:
 *       type: string
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
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             products:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorProduct"
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
 *   - Vendor Product Collections
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { productIds, count } = await filterSellerProductsByCollection(
    req.scope,
    req.params.id,
    req.filterableFields.seller_id as string,
    req.queryConfig.pagination?.skip || 0,
    req.queryConfig.pagination?.take || 10
  );

  const { data: products } = await query.graph({
    entity: 'product',
    fields: req.queryConfig.fields,
    filters: {
      id: productIds
    }
  });

  res.json({
    products,
    count,
    offset: req.queryConfig.pagination?.skip || 0,
    limit: req.queryConfig.pagination?.take || 10
  });
};
