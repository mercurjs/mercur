import { MedusaNextFunction, MedusaResponse, MedusaRequest, MiddlewareFunction } from '@medusajs/framework'

/**
 * Due to Medusa's `unlessPath` function bug, we need to use this function to skip middlewares for particular routes.
 * @param onPath - Regular expression to match against the base URL
 * @param middleware - The middleware function to execute
 * @param methods - Optional array of HTTP methods to match against. If not provided, matches all methods.
 */
export const unlessBaseUrl =
  (onPath: RegExp, middleware: MiddlewareFunction, methods?: string[]) =>
  (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    const methodMatches = !methods || methods.includes(req.method.toUpperCase())
    if (onPath.test(req.baseUrl) && methodMatches) {
      return next()
    } else {
      return middleware(req, res, next)
    }
  }
