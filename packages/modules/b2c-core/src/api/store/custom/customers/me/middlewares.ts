import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'
import { authenticate } from '@medusajs/medusa/utils'

import { storeCustomerQueryConfig } from './query-config'
import { StoreGetCustomerMeParams } from './validators'

export const storeCustomerMeMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/store/custom/customers/me',
    middlewares: [
      authenticate('customer', ['session', 'bearer']),
      validateAndTransformQuery(
        StoreGetCustomerMeParams,
        storeCustomerQueryConfig
      )
    ]
  }
]
