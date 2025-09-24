import { MiddlewareRoute } from '@medusajs/framework'

export const hooksMiddlewares: MiddlewareRoute[] = [
  {
    method: ['POST'],
    matcher: '/hooks/payouts',
    bodyParser: { preserveRawBody: true }
  }
]
