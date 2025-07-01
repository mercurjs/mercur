import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerReview from '../../../../../links/seller-review'

/**
 * @oas [get] /vendor/sellers/me/reviews
 * operationId: "VendorGetSellerMyReviews"
 * summary: "Get reviews of the current seller"
 * description: "Retrieves the reviews about the seller associated with the authenticated user."
 * x-authenticated: true
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
 *                 $ref: "#/components/schemas/Review"
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
 *   - Vendor Reviews
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: reviews, metadata } = await query.graph({
    entity: sellerReview.entryPoint,
    fields: req.queryConfig.fields.map((field) => `review.${field}`),
    filters: { ...req.filterableFields, withDeleted: true },
    pagination: req.queryConfig.pagination
  })

  res.json({
    reviews: reviews.map((relation) => relation.review),
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
