import { NextFunction } from 'express'

import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import sellerOrderLink from '../../../links/seller-order'
import sellerLocationLink from '../../../links/seller-stock-location'
import { checkResourceOwnershipByResourceId } from '../../../shared/infra/http/middlewares'
import {
  vendorOrderChangesQueryConfig,
  vendorOrderQueryConfig
} from './query-config'
import {
  VendorCreateFulfillment,
  VendorCreateFulfillmentType,
  VendorGetOrderChangesParams,
  VendorGetOrderParams,
  VendorOrderCreateShipment
} from './validators'

const transformPaymentFilters = () => {
  return async (
    req: MedusaRequest,
    _res: MedusaResponse,
    next: NextFunction
  ) => {
    if (!req.queryConfig || !req.queryConfig.fields) {
      return next()
    }

    req.queryConfig.fields = req.queryConfig.fields
      .filter((f) => !f.includes('payment_collections'))
      .concat(['split_order_payment.*'])

    return next()
  }
}

export const vendorOrderMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/orders',
    middlewares: [
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.list
      ),
      transformPaymentFilters()
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
      transformPaymentFilters(),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint,
        filterField: 'order_id'
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
      transformPaymentFilters(),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint,
        filterField: 'order_id'
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
      transformPaymentFilters(),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint,
        filterField: 'order_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/orders/:id/fulfillments',
    middlewares: [
      validateAndTransformBody(VendorCreateFulfillment),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint,
        filterField: 'order_id'
      }),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerLocationLink.entryPoint,
        filterField: 'stock_location_id',
        resourceId: (
          req: AuthenticatedMedusaRequest<VendorCreateFulfillmentType>
        ) => req.validatedBody.location_id
      })
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/orders/:id/changes',
    middlewares: [
      validateAndTransformQuery(
        VendorGetOrderChangesParams,
        vendorOrderChangesQueryConfig.list
      ),
      transformPaymentFilters(),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint,
        filterField: 'order_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/orders/:id/fulfillments/:fulfillment_id/cancel',
    middlewares: [
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
      transformPaymentFilters(),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint,
        filterField: 'order_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher:
      '/vendor/orders/:id/fulfillments/:fulfillment_id/mark-as-delivered',
    middlewares: [
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
      transformPaymentFilters(),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint,
        filterField: 'order_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/orders/:id/fulfillments/:fulfillment_id/shipments',
    middlewares: [
      validateAndTransformBody(VendorOrderCreateShipment),
      validateAndTransformQuery(
        VendorGetOrderParams,
        vendorOrderQueryConfig.retrieve
      ),
      transformPaymentFilters(),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerOrderLink.entryPoint,
        filterField: 'order_id'
      })
    ]
  }
]
