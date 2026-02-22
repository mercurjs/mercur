import { NextFunction } from 'express'

import { MedusaRequest } from '@medusajs/framework/http'

/**
 * @desc Adds request status to filterableFileds
 */
export function applyRequestsStatusFilter() {
  return async (req: MedusaRequest, _, next: NextFunction) => {
    if (req.validatedQuery.status) {
      req.filterableFields.status = req.validatedQuery.status
    }

    return next()
  }
}
