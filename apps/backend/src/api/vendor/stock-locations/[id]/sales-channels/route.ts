import { linkSalesChannelsToStockLocationWorkflow } from '@medusajs/core-flows'
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { LinkMethodRequest } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [post] /vendor/stock-locations/{id}/sales-channels
 * operationId: "VendorUpdateStockLocationSalesChannels"
 * summary: "Update Stock Location Sales Channels"
 * description: "Updates the sales channels of a Stock Location."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Stock Location
 *     schema:
 *       type: string
 *   - in: query
 *     name: fields
 *     description: The comma-separated fields to include in the response
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           add:
 *             type: array
 *             description: Array of sales channel IDs to add
 *             items:
 *               type: string
 *           remove:
 *             type: array
 *             description: Array of sales channel IDs to remove
 *             items:
 *               type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             stock_location:
 *               $ref: "#/components/schemas/VendorStockLocation"
 * tags:
 *   - Vendor Stock Locations
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<LinkMethodRequest>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { add, remove } = req.validatedBody

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const workflow = linkSalesChannelsToStockLocationWorkflow(req.scope)
  await workflow.run({
    input: {
      id,
      add,
      remove
    }
  })

  const {
    data: [stockLocation]
  } = await query.graph({
    entity: 'stock_location',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.status(200).json({ stock_location: stockLocation })
}
