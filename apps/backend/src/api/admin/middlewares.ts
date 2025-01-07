import { MiddlewareRoute, authenticate } from '@medusajs/medusa'

import { orderSetsMiddlewares } from './order-sets/middlewares'
import { sellerMiddlewares } from './vendor/seller/middlewares'

export const adminMiddlewares: MiddlewareRoute[] = [
  {
    method: 'ALL',
    matcher: 'admin/*',
    middlewares: [authenticate('admin', ['session', 'bearer'])]
  },
  ...orderSetsMiddlewares,
  ...sellerMiddlewares
]
