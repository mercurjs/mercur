import { NextFunction } from 'express'

import { AuthenticatedMedusaRequest } from '@medusajs/framework/http'

/**
 * @desc Adds seller request type to filterableFileds
 */
export function filterBySellerRequestType() {
  return async (req: AuthenticatedMedusaRequest, _, next: NextFunction) => {
    req.filterableFields.type = req.query.typ

    return next()
  }
}
