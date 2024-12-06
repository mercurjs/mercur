import { NextFunction } from 'express'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

type CheckResourceOwnershipByResourceIdOptions<Body> = {
  entryPoint: string
  filterField?: string
  resourceId?: (req: AuthenticatedMedusaRequest<Body>) => string
}

/**
 * Middleware that verifies if the authenticated member owns/has access to the requested resource.
 * This is done by checking if the member's seller ID matches the resource's seller ID.
 *
 * @param options - Configuration options for the ownership check
 * @param options.entryPoint - The entity type to verify ownership of (e.g. 'seller_product', 'service_zone')
 * @param options.filterField - Field used to filter/lookup the resource (defaults to 'id')
 * @param options.paramIdField - Request parameter containing the resource ID (defaults to 'id')
 *
 * @throws {MedusaError} If the member does not own the resource
 *
 * @example
 * // Basic usage - check ownership of vendor product
 * app.use(checkResourceOwnershipByParamId({
 *   entryPoint: 'seller_product'
 * }))
 *
 * @example
 * // Custom field usage - check ownership of service zone
 * app.use(checkResourceOwnershipByParamId({
 *   entryPoint: 'service_zone',
 *   filterField: 'service_zone_id',
 *   resourceId: (req) => req.params.zone_id
 * }))
 */
export const checkResourceOwnershipByResourceId = <Body>({
  entryPoint,
  filterField = 'id',
  resourceId = (req) => req.params.id
}: CheckResourceOwnershipByResourceIdOptions<Body>) => {
  return async (
    req: AuthenticatedMedusaRequest<Body>,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [member]
    } = await query.graph(
      {
        entity: 'member',
        fields: ['seller.id'],
        filters: {
          id: req.auth_context.actor_id
        }
      },
      { throwIfKeyNotFound: true }
    )

    const id = resourceId(req)

    const {
      data: [resource]
    } = await query.graph({
      entity: entryPoint,
      fields: ['seller_id'],
      filters: {
        [filterField]: id
      }
    })

    if (!resource) {
      res.status(404).json({
        message: `${entryPoint} with ${filterField}: ${id} not found`,
        type: MedusaError.Types.NOT_FOUND
      })
      return
    }

    if (member.seller.id !== resource.seller_id) {
      res.status(403).json({
        message: 'You are not allowed to perform this action',
        type: MedusaError.Types.NOT_ALLOWED
      })
      return
    }

    next()
  }
}
