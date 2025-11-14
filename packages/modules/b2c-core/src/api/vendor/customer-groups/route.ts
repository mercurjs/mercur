import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
} from '@medusajs/framework/utils'

import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { createSellerCustomerGroupWorkflow } from '../../../workflows/customer-groups/workflows'
import { VendorCreateCustomerGroupType } from './validators'

/**
 * @oas [get] /vendor/customer-groups
 * operationId: "VendorListCustomerGroups"
 * summary: "List Customer Groups"
 * description: "Retrieves a list of customer groups."
 * x-authenticated: true
 * parameters:
 *   - in: query
 *     name: limit
 *     schema:
 *       type: number
 *     description: The number of items to return. Default 50.
 *   - in: query
 *     name: offset
 *     schema:
 *       type: number
 *     description: The number of items to skip before starting the response. Default 0.
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
 *             customer_groups:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorCustomerGroup"
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

  const { seller_id, ...customerGroupFilters } = req.filterableFields

  const filters: any = {
    ...customerGroupFilters,
    deleted_at: {
      $eq: null
    }
  }

  if (seller_id) {
    filters.seller = {
      id: seller_id
    }
  }

  const { data: customer_groups, metadata } = await query.index({
    entity: 'customer_group',
    fields: req.queryConfig.fields,
    pagination: req.queryConfig.pagination,
    filters
  })

  res.json({
    customer_groups,
    count: metadata?.estimate_count ?? customer_groups.length,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? customer_groups.length
  })
}

/**
 * @oas [post] /vendor/customer-groups
 * operationId: "VendorCreateCustomerGroup"
 * summary: "Create a customer group"
 * description: "Creates a new customer group"
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateCustomerGroup"
 * responses:
 *   "201":
 *     description: Created
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
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { result: customer_group } =
    await createSellerCustomerGroupWorkflow.run({
      container: req.scope,
      input: {
        ...req.validatedBody,
        created_by: req.auth_context.actor_id,
        seller_id: seller.id
      }
    })

  res.status(201).json({
    customer_group
  })
}
