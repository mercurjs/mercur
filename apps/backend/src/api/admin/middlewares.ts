import { MiddlewareRoute } from '@medusajs/framework'

import { orderSetsMiddlewares } from './order-sets/middlewares'
import { requestsMiddlewares } from './requests/middlewares'

export const adminMiddlewares: MiddlewareRoute[] = [
  ...orderSetsMiddlewares,
  ...requestsMiddlewares
]
