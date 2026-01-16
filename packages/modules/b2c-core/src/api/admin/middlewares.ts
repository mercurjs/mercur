import { MiddlewareRoute } from '@medusajs/framework'

import { attributeMiddlewares } from './attributes/middlewares'
import { configurationMiddleware } from './configuration/middlewares'
import { orderSetsMiddlewares } from './order-sets/middlewares'
import { adminProductsMiddlewares } from './products/middlewares'
import { adminReservationsMiddlewares } from './reservations/middlewares'
import { sellerMiddlewares } from './sellers/middlewares'

export const adminMiddlewares: MiddlewareRoute[] = [
  ...orderSetsMiddlewares,
  ...configurationMiddleware,
  ...sellerMiddlewares,
  ...attributeMiddlewares,
  ...adminProductsMiddlewares,
  ...adminReservationsMiddlewares
]
