import { MiddlewareRoute } from '@medusajs/framework'

import { configurationMiddleware } from './configuration/middlewares'
import { orderSetsMiddlewares } from './order-sets/middlewares'
import { requestsMiddlewares } from './requests/middlewares'

export const adminMiddlewares: MiddlewareRoute[] = [
  ...orderSetsMiddlewares,
  ...requestsMiddlewares,
  ...configurationMiddleware
]
