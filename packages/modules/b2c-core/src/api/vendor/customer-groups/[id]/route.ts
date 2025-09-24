import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  deleteCustomerGroupsWorkflow,
  updateCustomerGroupsWorkflow
} from '@medusajs/medusa/core-flows'

import { VendorCreateCustomerGroupType } from '../validators'

/**
 * @oas [get] /vendor/customer-groups/{id}
 * operationId: "VendorGetCustomerGroupById"
 * summary: "Retrieve customer group by id"
 * description: "Retrieve customer group by id"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Customer group.
 *     schema:
 *       type: string
 *   - in: query
 *     name: fields
 *     schema:
 *       type: string
 *     description: Comma-separated fields that should be included in the returned data.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             member:
 *               $ref: "#/components/schemas/VendorCustomerGroup"
 * tags:
 *   - Vendor Customer Groups
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
    data: [customer_group]
  } = await query.graph({
    entity: 'customer_group',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({
    customer_group
  })
}

/**
 * @oas [post] /vendor/customer-groups/{id}
 * operationId: "VendorUpdateCustomerGroup"
 * summary: "Update customer group"
 * description: "Updates customer group"
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
 *         $ref: "#/components/schemas/VendorCreateCustomerGroup"
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
 *   - Vendor Customer Groups
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateCustomerGroupType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateCustomerGroupsWorkflow.run({
    input: {
      selector: {
        id: req.params.id
      },
      update: { ...req.validatedBody }
    }
  })

  const {
    data: [customer_group]
  } = await query.graph({
    entity: 'customer_group',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({
    customer_group
  })
}

/**
 * @oas [delete] /vendor/customer-groups/{id}
 * operationId: "VendorDeleteCustomerGroupById"
 * summary: "Delete a customer group"
 * description: "Deletes a customer group by id."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Customer group.
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
 *             id:
 *               type: string
 *               description: The ID of the deleted Customer group
 *             object:
 *               type: string
 *               description: The type of the object that was deleted
 *             deleted:
 *               type: boolean
 *               description: Whether or not the items were deleted
 * tags:
 *   - Vendor Customer Groups
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const id = req.params.id

  await deleteCustomerGroupsWorkflow.run({
    container: req.scope,
    input: { ids: [id] }
  })

  res.json({
    id,
    object: 'customer_group',
    deleted: true
  })
}
