import { MiddlewareRoute } from '@medusajs/framework'

import { storeCartsMiddlewares } from './carts/middlewares'

export const storeMiddlewares: MiddlewareRoute[] = [...storeCartsMiddlewares]
