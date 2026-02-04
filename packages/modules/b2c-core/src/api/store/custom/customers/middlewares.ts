import { MiddlewareRoute, validateAndTransformBody } from '@medusajs/framework'
import { StoreDeleteCustomerAccount } from './validators'

export const storeCustomersMiddlewares: MiddlewareRoute[] = [
  {
    method: ['DELETE'],
    matcher: '/store/customers/me',
    middlewares: [validateAndTransformBody(StoreDeleteCustomerAccount)]
  }
]
