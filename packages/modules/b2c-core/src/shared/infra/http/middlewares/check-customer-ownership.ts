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

export const checkCustomerResourceOwnershipByResourceId = <Body>({
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

    const id = resourceId(req)

    const {
      data: [resource]
    } = await query.graph({
      entity: entryPoint,
      fields: ['customer_id'],
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

    if (req.auth_context.actor_id !== resource.customer_id) {
      res.status(403).json({
        message: 'You are not allowed to perform this action',
        type: MedusaError.Types.NOT_ALLOWED
      })
      return
    }

    next()
  }
}
