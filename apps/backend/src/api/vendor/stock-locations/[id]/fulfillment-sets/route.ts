import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { IntermediateEvents } from '@mercurjs/framework'

import { fetchSellerByAuthActorId } from '../../../../../shared/infra/http/utils'
import { createLocationFulfillmentSetAndAssociateWithSellerWorkflow } from '../../../../../workflows/fulfillment-set/workflows'
import { VendorCreateStockLocationFulfillmentSetType } from '../../validators'

/**
 * @oas [post] /vendor/stock-locations/{id}/fulfillment-sets
 * operationId: "VendorCreateStockLocationFulfillmentSet"
 * summary: "Create a Fulfillment Set"
 * description: "Creates a Fulfillment Set for a Stock Location."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Stock Location.
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
 *         $ref: "#/components/schemas/VendorCreateStockLocationFulfillmentSet"
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
  req: AuthenticatedMedusaRequest<VendorCreateStockLocationFulfillmentSetType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  await createLocationFulfillmentSetAndAssociateWithSellerWorkflow(
    req.scope
  ).run({
    input: {
      location_id: req.params.id,
      fulfillment_set_data: {
        name: req.validatedBody.name,
        type: req.validatedBody.type
      },
      seller_id: seller.id
    }
  })

  const eventBus = req.scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({
    name: IntermediateEvents.STOCK_LOCATION_CHANGED,
    data: { id: req.params.id }
  })

  const {
    data: [stockLocation]
  } = await query.graph(
    {
      entity: 'stock_location',
      fields: req.queryConfig.fields,
      filters: {
        id: req.params.id
      }
    },
    { throwIfKeyNotFound: true }
  )

  res.status(200).json({ stock_location: stockLocation })
}
