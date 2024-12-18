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
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/orders/:id/cancel',
    middlewares: [
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/orders/:id/complete',
    middlewares: [
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/orders/:id/fulfillment',
    middlewares: [
      validateAndTransformBody(VendorCreateFulfillment),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint
      }),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerLocationLink.entryPoint,
        resourceId: (
          req: AuthenticatedMedusaRequest<VendorCreateFulfillmentType>
        ) => req.validatedBody.location_id
      })
    ]
  }
]
