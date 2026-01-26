import { NextFunction } from "express"

import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"

import { getSellerLinkedStockLocationIdSet } from "../../../../utils/stock-locations"

type RejectSellerLinkedStockLocationOptions<Body> = {
  /**
   * Extract stock_location_id from request. If it resolves to a falsy value,
   * the middleware will no-op and call next().
   */
  resourceId: (req: AuthenticatedMedusaRequest<Body>) => string | undefined
  /**
   * Error message override.
   */
  message?: string
}

/**
 * For admin flows where using a seller-linked stock location must be forbidden.
 * If the provided stock_location_id is linked to ANY seller, request is denied.
 */
export const rejectSellerLinkedStockLocation = <Body>({
  resourceId,
  message = "You are not allowed to use a seller-linked stock location",
}: RejectSellerLinkedStockLocationOptions<Body>) => {
  return async (
    req: AuthenticatedMedusaRequest<Body>,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    const id = resourceId(req)

    if (!id) {
      return next()
    }

    const linked = await getSellerLinkedStockLocationIdSet(req.scope, [id])

    if (linked.has(id)) {
      res.status(403).json({
        message,
        type: MedusaError.Types.NOT_ALLOWED,
      })
      return
    }

    return next()
  }
}


