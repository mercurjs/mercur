import { MiddlewareRoute, authenticate } from '@medusajs/framework'

import { storeCartsMiddlewares } from './carts/middlewares'
import { storeOrderReturnRequestsMiddlewares } from './return-request/middlewares'
import { storeReviewMiddlewares } from './reviews/middlewares'

export const storeMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/store/*',
    middlewares: [authenticate('customer', ['bearer', 'session'])]
  },
  ...storeCartsMiddlewares,
  ...storeOrderReturnRequestsMiddlewares,
  ...storeReviewMiddlewares
]
