import { NextFunction } from 'express'

import { MedusaRequest } from '@medusajs/framework/http'

/**
 * @desc Adds reference type filterableFileds
 */
export function applyReferenceFilter() {
  return async (req: MedusaRequest, _, next: NextFunction) => {
    if (req.validatedQuery.reference) {
      req.filterableFields.reference = req.validatedQuery.reference
    }
    return next()
  }
}
