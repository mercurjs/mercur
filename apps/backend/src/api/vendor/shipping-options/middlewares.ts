import sellerServiceZoneLink from '#/links/seller-service-zone'

import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import sellerShippingOptionLink from '../../../links/seller-shipping-option'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { vendorShippingOptionQueryConfig } from './query-config'
import {
  VendorCreateShippingOption,
  VendorCreateShippingOptionType,
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
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/shipping-options',
    middlewares: [
      validateAndTransformBody(VendorCreateShippingOption),
      checkResourceOwnershipByResourceId<VendorCreateShippingOptionType>({
        entryPoint: sellerServiceZoneLink.entryPoint,
        filterField: 'service_zone_id',
        resourceId: (req) => req.validatedBody.service_zone_id
      }),
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
