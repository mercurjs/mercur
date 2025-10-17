import {
  MedusaRequest,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import sellerFulfillmentSetLink from '../../../links/seller-fulfillment-set'
import sellerServiceZoneLink from '../../../links/seller-service-zone'
import { checkResourceOwnershipByResourceId } from '../../../shared/infra/http/middlewares'
import { vendorFulfillmentSetQueryConfig } from './query-config'
import {
  VendorCreateFulfillmentSetServiceZonesSchema,
  VendorFulfillmentSetParams,
  VendorUpdateServiceZone
} from './validators'

export const vendorFulfillmentSetsMiddlewares: MiddlewareRoute[] = [
  /* Fulfillment Set */
  {
    method: ['DELETE'],
    matcher: '/vendor/fulfillment-sets/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerFulfillmentSetLink.entryPoint,
        filterField: 'fulfillment_set_id'
      })
    ]
  },

  /* Service Zones */
  {
    method: ['POST'],
    matcher: '/vendor/fulfillment-sets/:id/service-zones',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerFulfillmentSetLink.entryPoint,
        filterField: 'fulfillment_set_id'
      }),
      validateAndTransformBody(VendorCreateFulfillmentSetServiceZonesSchema),
      validateAndTransformQuery(
        VendorFulfillmentSetParams,
        vendorFulfillmentSetQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/fulfillment-sets/:id/service-zones/:zone_id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerFulfillmentSetLink.entryPoint,
        filterField: 'fulfillment_set_id'
      }),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerServiceZoneLink.entryPoint,
        filterField: 'service_zone_id',
        resourceId: (req: MedusaRequest) => req.params.zone_id
      }),
      validateAndTransformBody(VendorUpdateServiceZone),
      validateAndTransformQuery(
        VendorFulfillmentSetParams,
        vendorFulfillmentSetQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/fulfillment-sets/:id/service-zones/:zone_id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerFulfillmentSetLink.entryPoint,
        filterField: 'fulfillment_set_id'
      }),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerServiceZoneLink.entryPoint,
        filterField: 'service_zone_id',
        resourceId: (req: MedusaRequest) => req.params.zone_id
      })
    ]
  }
]
