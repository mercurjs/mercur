import { NextFunction } from 'express'

import { MedusaRequest } from '@medusajs/framework/http'

/**
 * @desc Adds request type and status to filterableFileds
 */
export function applyRequestsFilterableFields() {
  return async (req: MedusaRequest, _, next: NextFunction) => {
    if (req.validatedQuery.type) {
      req.filterableFields.type = req.validatedQuery.type
    }

    if (req.validatedQuery.status) {
      req.filterableFields.status = req.validatedQuery.status
    }

    return next()
  }
}
