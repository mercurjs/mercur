import { NextFunction } from 'express'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { StoreStatus } from '@mercurjs/framework'

import { fetchSellerByAuthActorId } from '../utils/seller'

/**
 * Middleware that checks store status and request method to determine access.
 * - Allows all operations if store status is ACTIVE
 * - Allows GET operations for any store status
 * - Blocks all other operations with 403 Forbidden
 */
export const storeActiveGuard = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: NextFunction
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope,
    ['store_status']
  )

  const isActiveStore = seller.store_status === StoreStatus.ACTIVE
  const isGetRequest = req.method === 'GET'

  if (isActiveStore || isGetRequest) {
    return next()
  }

  return res.status(403).json({
    message: 'Operation not allowed for current store status'
  })
}
