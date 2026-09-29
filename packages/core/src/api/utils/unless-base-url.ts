import { MedusaNextFunction } from '@medusajs/framework'
import { MedusaResponse, MiddlewareFunction } from '@medusajs/framework'
import { MedusaRequest } from '@medusajs/framework'

type PathMatcher =
    | RegExp
    | RegExp[]
    | ((req: MedusaRequest) => RegExp[] | Promise<RegExp[]>)

/**
 * Due to Medusa's `unlessPath` function bug, we need to use this function to skip middlewares for particular routes.
 * @param onPath - Regular expression(s) to match against the base URL, or a resolver returning them per request
 * @param middleware - The middleware function to execute
 * @param methods - Optional array of HTTP methods to match against. If not provided, matches all methods.
 */
export const unlessBaseUrl =
    (onPath: PathMatcher, middleware: MiddlewareFunction, methods?: string[]) =>
        async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
            const methodMatches = !methods || methods.includes(req.method.toUpperCase())
            let paths: RegExp[]
            try {
                paths = typeof onPath === "function"
                    ? await onPath(req)
                    : Array.isArray(onPath) ? onPath : [onPath]
            } catch (error) {
                return next(error)
            }
            const pathMatches = paths.some(p => p.test(req.baseUrl))
            if (pathMatches && methodMatches) {
                return next()
            } else {
                return middleware(req, res, next)
            }
        }
