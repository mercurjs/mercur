import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'

/**
 * @oas [get] /vendor/fulfillment-providers/{id}/options
 * operationId: "VendorListFulfillmentProviderOptions"
 * summary: "List Fulfillment Provider Options"
 * description: "Retrieves a list of available Fulfillment Provider Options."
 * x-authenticated: true
 * parameters:
 * - in: path
 *   name: id
 *   required: true
 *   description: The ID of the fulfillment provider.
 *   schema:
 *     type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             fulfillment_options:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                     id:
 *                       type: string
 *                     is_return:
 *                       type: boolean
 * tags:
 *   - Vendor Fulfillment Providers
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const fulfillmentProviderService = req.scope.resolve(Modules.FULFILLMENT)

  const fulfillment_options =
    await fulfillmentProviderService.retrieveFulfillmentOptions(req.params.id)

  res.json({
    fulfillment_options
  })
}
