import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import {
  selectCustomersChartData,
  selectOrdersChartData
} from '@mercurjs/seller'

import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'

/**
 * @oas [get] /vendor/statistics
 * operationId: "VendorGetStoreStatistics"
 * summary: "GetStoreStatistics"
 * description: "Retrieves store statistics."
 * x-authenticated: true
 * parameters:
 *   - name: time_from
 *     in: query
 *     schema:
 *       type: string
 *   - name: time_to
 *     in: query
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
 *             orders:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorDateStatistics"
 *             customers:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorDateStatistics"
 * tags:
 *   - Vendor Statistics
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const orders = await selectOrdersChartData(req.scope, seller.id, [
    (req.validatedQuery.time_from as Date).toISOString(),
    (req.validatedQuery.time_to as Date).toISOString()
  ])
  const customers = await selectCustomersChartData(req.scope, seller.id, [
    (req.validatedQuery.time_from as Date).toISOString(),
    (req.validatedQuery.time_to as Date).toISOString()
  ])

  res.json({ orders, customers })
}
