import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import {
  vendorCustomerOrdersQueryConfig,
  vendorCustomerQueryConfig
} from './query-config'
import {
  VendorGetCustomerOrdersParams,
  VendorGetCustomersParams,
  VendorUpdateCustomerGroups
} from './validators'

export const vendorCustomersMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/customers',
    middlewares: [
      validateAndTransformQuery(
        VendorGetCustomersParams,
        vendorCustomerQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/customers/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetCustomersParams,
        vendorCustomerQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/customers/:id/orders',
    middlewares: [
      validateAndTransformQuery(
        VendorGetCustomerOrdersParams,
        vendorCustomerOrdersQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/customers/:id/customer-groups',
    middlewares: [
      validateAndTransformBody(VendorUpdateCustomerGroups),
      validateAndTransformQuery(
        VendorGetCustomersParams,
        vendorCustomerQueryConfig.retrieve
      )
    ]
  }
]
