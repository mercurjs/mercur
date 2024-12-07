import { MiddlewareRoute } from '@medusajs/framework'

import { orderSetsMiddlewares } from './order-sets/middlewares'

export const adminMiddlewares: MiddlewareRoute[] = [...orderSetsMiddlewares]
