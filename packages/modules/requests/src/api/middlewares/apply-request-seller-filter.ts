import { NextFunction } from 'express';

import { MedusaRequest } from '@medusajs/framework/http';

/**
 * @desc Adds request seller_id (vendor) to filterableFields
 */
export function applyRequestsSellerFilter() {
  return async (req: MedusaRequest, _: unknown, next: NextFunction) => {
    if (req.validatedQuery?.seller_id) {
      req.filterableFields.seller_id = req.validatedQuery.seller_id;
    }
    return next();
  };
}
