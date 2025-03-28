import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import {
  VendorCreateSellerApiKey,
  VendorGetSellerApiKeysParams
} from './validators'

export const vendorApiKeyMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/api-keys',
    middlewares: [
      validateAndTransformQuery(VendorGetSellerApiKeysParams, {}),
      filterBySellerId()
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/api-keys',
    middlewares: [validateAndTransformBody(VendorCreateSellerApiKey)]
  },
  {
    method: ['DELETE', 'GET'],
    matcher: '/vendor/api-keys/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({ entryPoint: 'seller_api_key' })
    ]
  }
]
