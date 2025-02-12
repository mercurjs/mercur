import { MiddlewareRoute } from '@medusajs/framework'

import { configurationMiddleware } from './configuration/middlewares'
import { defaultShippingOptionMiddlewares } from './default-shipping-option/middlewares'
import { orderSetsMiddlewares } from './order-sets/middlewares'
import { requestsMiddlewares } from './requests/middlewares'
import { returnRequestsMiddlewares } from './return-request/middlewares'

export const adminMiddlewares: MiddlewareRoute[] = [
  ...orderSetsMiddlewares,
  ...requestsMiddlewares,
  ...configurationMiddleware,
  ...returnRequestsMiddlewares,
  ...defaultShippingOptionMiddlewares
]
