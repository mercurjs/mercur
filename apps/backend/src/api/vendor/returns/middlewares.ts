import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import sellerReturn from '../../../links/seller-return'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { vendorReturnsQueryConfig } from './query-config'
import { VendorGetReturnsParams } from './validators'

export const vendorReturnsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/returns',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnsQueryConfig.list
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/returns/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnsQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReturn.entryPoint,
        filterField: 'return_id'
      })
    ]
  }
]
