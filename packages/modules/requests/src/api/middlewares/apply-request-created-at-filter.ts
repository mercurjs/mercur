import { NextFunction } from 'express';

import { MedusaRequest } from '@medusajs/framework/http';

/**
 * @desc Adds request created_at date filter to filterableFields
 */
export function applyRequestsCreatedAtFilter() {
  return async (req: MedusaRequest, _: unknown, next: NextFunction) => {
    if (req.validatedQuery?.created_at) {
      req.filterableFields.created_at = req.validatedQuery.created_at;
    }
    return next();
  };
}
