import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { storeSellerQueryConfig } from './query-config'
import { StoreGetSellersParams } from './validators'

export const storeSellerMiddlewares: MiddlewareRoute[] = [
  {
    methods: ['GET'],
    matcher: '/store/seller',
    middlewares: [
      validateAndTransformQuery(
        StoreGetSellersParams,
        storeSellerQueryConfig.list
      )
    ]
  },
  {
    methods: ['GET'],
    matcher: '/store/seller/:handle',
    middlewares: [
      validateAndTransformQuery(
        StoreGetSellersParams,
        storeSellerQueryConfig.retrieve
      )
    ]
  }
]
