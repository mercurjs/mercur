import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/framework/http'

import sellerShippingProfile from '../../../links/seller-shipping-profile'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { shippingProfilesQueryConfig } from './query-config'
import {
  VendorCreateShippingProfile,
  VendorGetShippingProfilesParams,
  VendorUpdateShippingProfile
} from './validators'

export const vendorShippingProfilesMiddlewares: MiddlewareRoute[] = [
  {
    method: ['POST'],
    matcher: '/vendor/shipping-profiles',
    middlewares: [
      validateAndTransformBody(VendorCreateShippingProfile),
      validateAndTransformQuery(
        VendorGetShippingProfilesParams,
        shippingProfilesQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/shipping-profiles',
    middlewares: [
      validateAndTransformQuery(
        VendorGetShippingProfilesParams,
        shippingProfilesQueryConfig.list
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/shipping-profiles/:id',
    middlewares: [
      validateAndTransformBody(VendorUpdateShippingProfile),
      validateAndTransformQuery(
        VendorGetShippingProfilesParams,
        shippingProfilesQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerShippingProfile.entryPoint,
        filterField: 'shipping_profile_id'
      })
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/shipping-profiles/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerShippingProfile.entryPoint,
        filterField: 'shipping_profile_id'
      })
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/shipping-profiles/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetShippingProfilesParams,
        shippingProfilesQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerShippingProfile.entryPoint,
        filterField: 'shipping_profile_id'
      })
    ]
  }
]
