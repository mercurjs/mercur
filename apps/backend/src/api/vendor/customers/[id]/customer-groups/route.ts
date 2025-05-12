import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { linkCustomerGroupsToCustomerWorkflow } from '@medusajs/medusa/core-flows'

import { fetchSellerByAuthActorId } from '../../../../../shared/infra/http/utils'
import { validateCustomerGroupsOwnership } from '../../utils'
import { VendorUpdateCustomerGroupsType } from '../../validators'

/**
 * @oas [post] /vendor/customers/{id}/customer-groups
 * operationId: "VendorLinkCustomerToCustomerGroups"
 * summary: "Link customers to customer group"
 * description: "Adds or removes customer groups to a customer"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Customer.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorUpdateCustomersCustomerGroups"
 * responses:
 *   "200":
 *     description: Ok
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             customer:
 *               $ref: "#/components/schemas/VendorCustomer"
 * tags:
 *   - Seller
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateCustomerGroupsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  await validateCustomerGroupsOwnership(
    req.scope,
    seller.id,
    req.validatedBody.add.concat(req.validatedBody.remove)
  )

  await linkCustomerGroupsToCustomerWorkflow.run({
    container: req.scope,
    input: {
      id: req.params.id,
      ...req.validatedBody
    }
  })

  const {
    data: [customer]
  } = await query.graph({
    entity: 'customer',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({
    customer
  })
}
