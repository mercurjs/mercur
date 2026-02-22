import { NextFunction } from 'express'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

type CheckResourceOwnershipByResourceIdOptions<Body> = {
  entryPoint: string
  filterField?: string
  resourceId?: (req: AuthenticatedMedusaRequest<Body>) => string | string[]
}

/**
 * Middleware that verifies if the authenticated member owns/has access to the requested resource(s).
 * This is done by checking if the member's seller ID matches the resource's seller ID.
 * Supports both single resource ID and arrays of resource IDs.
 *
 * @param options - Configuration options for the ownership check
 * @param options.entryPoint - The entity type to verify ownership of (e.g. 'seller_product', 'service_zone')
 * @param options.filterField - Field used to filter/lookup the resource (defaults to 'id')
 * @param options.resourceId - Function to extract resource ID(s) from the request (defaults to req.params.id)
 *
 * @throws {MedusaError} If the member does not own any of the resources
 *
 * @example
 * // Basic usage - check ownership of single vendor product
 * app.use(checkResourceOwnershipByResourceId({
 *   entryPoint: 'seller_product'
 * }))
 *
 * @example
 * // Custom field usage - check ownership of service zone
 * app.use(checkResourceOwnershipByResourceId({
 *   entryPoint: 'service_zone',
 *   filterField: 'service_zone_id',
 *   resourceId: (req) => req.params.zone_id
 * }))
 *
 * @example
 * // Batch usage - check ownership of multiple promotions
 * app.use(checkResourceOwnershipByResourceId({
 *   entryPoint: 'seller_promotion',
 *   filterField: 'promotion_id',
 *   resourceId: (req) => [...(req.body.add || []), ...(req.body.remove || [])]
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

    const ids = resourceId(req)
    const idArray = Array.isArray(ids) ? ids : [ids]

    if (idArray.length === 0) {
      next()
      return
    }

    const { data: resources } = await query.graph({
      entity: entryPoint,
      fields: ['seller_id'],
      filters: {
        [filterField]: idArray,
        seller_id: member.seller.id
      }
    })

    if (resources.length !== idArray.length) {
      res.status(403).json({
        message: 'You are not allowed to perform this action',
        type: MedusaError.Types.NOT_ALLOWED
      })
      return
    }

    next()
  }
}
