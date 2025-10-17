import { NextFunction } from 'express'

import { MedusaRequest } from '@medusajs/framework/http'

/**
 * @desc Adds request type filterableFileds
 */
export function applyRequestsTypeFilter() {
  return async (req: MedusaRequest, _, next: NextFunction) => {
    if (req.validatedQuery.type) {
      req.filterableFields.type = req.validatedQuery.type
    }
    return next()
  }
}
