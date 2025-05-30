import { NextFunction } from 'express'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { StoreStatus } from '../../../../modules/seller/types'
import { fetchSellerByAuthActorId } from '../utils'

export function checkSellerStatus(expected: StoreStatus | StoreStatus[]) {
  return async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    const expected_status = Array.isArray(expected) ? expected : [expected]

    const seller = await fetchSellerByAuthActorId(
      req.auth_context.actor_id,
      req.scope,
      ['store_status']
    )

    if (expected_status.includes(seller.store_status)) {
      return next()
    }

    res.status(403).json({
      message: 'Incorrect store status!'
    })
  }
}
