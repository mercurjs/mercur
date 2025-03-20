import { NextFunction } from 'express'

import { AuthenticatedMedusaRequest } from '@medusajs/framework/http'

import { fetchSellerByAuthContext } from '../utils/seller'

/**
 * @desc Adds a seller id to the filterable fields
 */
export function filterBySellerId() {
  return async (req: AuthenticatedMedusaRequest, _, next: NextFunction) => {
    const seller = await fetchSellerByAuthContext(req.auth_context, req.scope)

    req.filterableFields.seller_id = seller.id

    return next()
  }
}
