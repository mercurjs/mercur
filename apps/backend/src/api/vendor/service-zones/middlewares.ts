import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import sellerServiceZoneLink from '../../../links/seller-service-zone'
import sellerShippingOptionLink from '../../../links/seller-shipping-option'
import {
  checkResourceOwnershipByParamId,
  filterFieldSellerId
} from '../../../shared/infra/http/middlewares'
import { vendorServiceZoneQueryConfig } from './query-config'
import {
  VendorCreateServiceZone,
  VendorCreateShippingOption,
  VendorGetServiceZoneParams,
  VendorGetShippingOptionParams,
  VendorUpdateServiceZone,
  VendorUpdateShippingOption
} from './validators'

export const vendorServiceZonesMiddlewares: MiddlewareRoute[] = [
  /* Service Zones */
  {
    method: ['GET'],
    matcher: '/vendor/service-zones',
    middlewares: [
      validateAndTransformQuery(
        VendorGetServiceZoneParams,
        vendorServiceZoneQueryConfig.list
      ),
      filterFieldSellerId()
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/service-zones',
    middlewares: [
      validateAndTransformBody(VendorCreateServiceZone),
      validateAndTransformQuery(
        VendorGetServiceZoneParams,
        vendorServiceZoneQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/service-zones/:id',
    middlewares: [
      checkResourceOwnershipByParamId({
        entryPoint: sellerServiceZoneLink.entryPoint,
        filterField: 'service_zone_id'
      }),
      validateAndTransformQuery(
        VendorGetServiceZoneParams,
        vendorServiceZoneQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/service-zones/:id',
    middlewares: [
      checkResourceOwnershipByParamId({
        entryPoint: sellerServiceZoneLink.entryPoint,
        filterField: 'service_zone_id'
      }),
      validateAndTransformBody(VendorUpdateServiceZone),
      validateAndTransformQuery(
        VendorGetServiceZoneParams,
        vendorServiceZoneQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/service-zones/:id',
    middlewares: [
      checkResourceOwnershipByParamId({
        entryPoint: sellerServiceZoneLink.entryPoint,
        filterField: 'service_zone_id'
      })
    ]
  },

  /* Shipping Options */
  {
    method: ['GET'],
    matcher: '/vendor/service-zones/:id/shipping-options',
    middlewares: [
      checkResourceOwnershipByParamId({
        entryPoint: sellerServiceZoneLink.entryPoint,
        filterField: 'service_zone_id'
      }),
      validateAndTransformQuery(
        VendorGetShippingOptionParams,
        vendorServiceZoneQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/service-zones/:id/shipping-options',
    middlewares: [
      checkResourceOwnershipByParamId({
        entryPoint: sellerServiceZoneLink.entryPoint,
        filterField: 'service_zone_id'
      }),
      validateAndTransformBody(VendorCreateShippingOption),
      validateAndTransformQuery(
        VendorGetShippingOptionParams,
        vendorServiceZoneQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/service-zones/:id/shipping-options/:option_id',
    middlewares: [
      checkResourceOwnershipByParamId({
        entryPoint: sellerServiceZoneLink.entryPoint,
        filterField: 'service_zone_id',
        paramIdField: 'option_id'
      }),
      validateAndTransformQuery(
        VendorGetShippingOptionParams,
        vendorServiceZoneQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/service-zones/:id/shipping-options/:option_id',
    middlewares: [
      checkResourceOwnershipByParamId({
        entryPoint: sellerShippingOptionLink.entryPoint,
        filterField: 'service_zone_id',
        paramIdField: 'option_id'
      }),
      validateAndTransformBody(VendorUpdateShippingOption),
      validateAndTransformQuery(
        VendorGetShippingOptionParams,
        vendorServiceZoneQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/service-zones/:id/shipping-options/:option_id',
    middlewares: [
      checkResourceOwnershipByParamId({
        entryPoint: sellerShippingOptionLink.entryPoint,
        filterField: 'service_zone_id',
        paramIdField: 'option_id'
      })
    ]
  }
]
