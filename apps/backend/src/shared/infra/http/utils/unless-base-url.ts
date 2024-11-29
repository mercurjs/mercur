import { MedusaNextFunction } from '@medusajs/framework'
import { MedusaResponse, MiddlewareFunction } from '@medusajs/framework'
import { MedusaRequest } from '@medusajs/framework'

/**
 * Due to Medusa's `unlessPath` function bug, we need to use this function to skip middlewares for particular routes.
 */
export const unlessBaseUrl =
  (onPath: RegExp, middleware: MiddlewareFunction) =>
  (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    if (onPath.test(req.baseUrl)) {
      return next()
    } else {
      return middleware(req, res, next)
    }
  }
