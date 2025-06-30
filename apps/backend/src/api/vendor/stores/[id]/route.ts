import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [get] /vendor/stores/{id}
 * operationId: "VendorGetStoreById"
 * summary: "Get store"
 * description: "Retrieves a Store by id."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the store
 *     schema:
 *       type: string
 *   - in: query
 *     name: fields
 *     description: The comma-separated fields to include in the response
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
 *             store:
 *               $ref: "#/components/schemas/VendorStore"
 * tags:
 *   - Vendor Stores
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [store]
  } = await query.graph({
    entity: 'store',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({
    store
  })
}
