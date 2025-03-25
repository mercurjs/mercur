import { linkCustomersToCustomerGroupWorkflow } from '@medusajs/core-flows'
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { VendorLinkCustomersToGroupType } from '../../validators'

/**
 * @oas [post] /vendor/customer-groups/{id}/customers
 * operationId: "VendorUpdateCustomersInCustomerGroup"
 * summary: "Link customers to customer group"
 * description: "Adds or removes customers to a customer group"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Customer group.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorLinkCustomersToGroup"
 * responses:
 *   "200":
 *     description: Ok
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             customer_group:
 *               $ref: "#/components/schemas/VendorCustomerGroup"
 * tags:
 *   - Seller
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorLinkCustomersToGroupType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params
  const { add, remove } = req.validatedBody

  await linkCustomersToCustomerGroupWorkflow.run({
    container: req.scope,
    input: {
      id,
      add,
      remove
    }
  })

  const {
    data: [customer_group]
  } = await query.graph({
    entity: 'customer_group',
    fields: req.queryConfig.fields,
    filters: {
      id
    }
  })

  res.json({ customer_group })
}
