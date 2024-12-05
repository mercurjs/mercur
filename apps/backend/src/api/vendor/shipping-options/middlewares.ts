import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import sellerShippingOptionLink from '../../../links/seller-shipping-option'
import { checkResourceOwnershipByResourceId } from '../../../shared/infra/http/middlewares'
import { vendorShippingOptionQueryConfig } from './query-config'
import {
  VendorCreateShippingOption,
  VendorGetShippingOptionParams,
  VendorUpdateShippingOption
} from './validators'

export const vendorShippingOptionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/shipping-options',
    middlewares: [
      validateAndTransformQuery(
        VendorGetShippingOptionParams,
        vendorShippingOptionQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/shipping-options',
    middlewares: [
      validateAndTransformBody(VendorCreateShippingOption),
      validateAndTransformQuery(
        VendorGetShippingOptionParams,
        vendorShippingOptionQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/shipping-options/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerShippingOptionLink.entryPoint,
        filterField: 'shipping_option_id'
      }),
      validateAndTransformQuery(
        VendorGetShippingOptionParams,
        vendorShippingOptionQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/shipping-options/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerShippingOptionLink.entryPoint,
        filterField: 'shipping_option_id'
      }),
      validateAndTransformBody(VendorUpdateShippingOption),
      validateAndTransformQuery(
        VendorGetShippingOptionParams,
        vendorShippingOptionQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/shipping-options/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerShippingOptionLink.entryPoint,
        filterField: 'shipping_option_id'
      })
    ]
  }
]
