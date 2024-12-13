import {
  AuthenticatedMedusaRequest,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import sellerOrderLink from '../../../links/seller-order'
import sellerLocationLink from '../../../links/seller-stock-location'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { vendorOrderQueryConfig } from './query-config'
import {
  VendorCreateFulfillment,
  VendorCreateFulfillmentType,
  VendorGetOrderParams
} from './validators'

export const vendorOrderMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/orders',
    middlewares: [
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.list
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/orders/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint
      }),
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/orders/:id/cancel',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint
      }),
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/orders/:id/complete',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint
      }),
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/orders/:id/fulfillment',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint
      }),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerLocationLink.entryPoint,
        resourceId: (
          req: AuthenticatedMedusaRequest<VendorCreateFulfillmentType>
        ) => req.validatedBody.location_id
      }),
      validateAndTransformBody(VendorCreateFulfillment)
    ]
  }
]
