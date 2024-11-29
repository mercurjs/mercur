import { AuthenticatedMedusaRequest } from '@medusajs/framework/http'
import { NextFunction } from 'express'

import { fetchSellerByAuthActorId } from '../utils/seller'

/**
 * @desc Adds a seller id to the filterable fields
 */
export function filterFieldSellerId() {
  return async (req: AuthenticatedMedusaRequest, _, next: NextFunction) => {
    const seller = await fetchSellerByAuthActorId(
      req.auth_context.actor_id,
      req.scope
    )

    req.filterableFields.seller_id = seller.id

    return next()
  }
}
