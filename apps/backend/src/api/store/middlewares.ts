import { MiddlewareRoute } from '@medusajs/framework'

import { storeCartsMiddlewares } from './carts/middlewares'
import { storeOrderReturnRequestsMiddlewares } from './return-request/middlewares'

export const storeMiddlewares: MiddlewareRoute[] = [
  ...storeCartsMiddlewares,
  ...storeOrderReturnRequestsMiddlewares
]
