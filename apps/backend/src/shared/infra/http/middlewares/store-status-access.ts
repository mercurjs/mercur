import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { MiddlewareFunction } from '@medusajs/framework'

/**
 * Middleware to control access based on store status
 * - If store status is active: allows all operations
 * - If store status is not active: allows only GET on all operations and POST on orders and fulfillment
 */
export const storeStatusAccess: MiddlewareFunction = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  // TODO: Replace this with actual store status check from your store model
  const storeStatus = req.store?.status || 'inactive'

  if (storeStatus === 'active') {
    return next()
  }

  const method = req.method.toUpperCase()
  const path = req.baseUrl

  // Allow GET requests for all paths
  if (method === 'GET') {
    return next()
  }

  // Allow POST requests only for orders and fulfillment
  if (
    method === 'POST' &&
    (path.includes('/orders') || path.includes('/fulfillment'))
  ) {
    return next()
  }

  // For all other cases, return 403 Forbidden
  return res.status(403).json({
    message: 'Access denied. Store is not active.'
  })
}
