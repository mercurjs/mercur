import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import sellerReturn from '../../../links/seller-return'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { vendorReturnsQueryConfig } from './query-config'
import {
  VendorGetReturnsParams,
  VendorReceiveReturnItemsSchema,
  VendorReceiveReturnSchema,
  VendorReturnsDismissItemsActionSchema,
  VendorReturnsReceiveItemsActionSchema
} from './validators'

export const vendorReturnsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/returns',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnsQueryConfig.list
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/returns/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnsQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReturn.entryPoint,
        filterField: 'return_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/returns/:id/dismiss-items',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnsQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorReceiveReturnItemsSchema),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReturn.entryPoint,
        filterField: 'return_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/returns/:id/dismiss-items/:action_id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnsQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorReturnsDismissItemsActionSchema),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReturn.entryPoint,
        filterField: 'return_id'
      })
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/returns/:id/dismiss-items/:action_id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnsQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReturn.entryPoint,
        filterField: 'return_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/returns/:id/receive',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnsQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorReceiveReturnSchema),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReturn.entryPoint,
        filterField: 'return_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/returns/:id/receive/confirm',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnsQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReturn.entryPoint,
        filterField: 'return_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/returns/:id/receive-items',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnsQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorReceiveReturnItemsSchema),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReturn.entryPoint,
        filterField: 'return_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/returns/:id/receive-items/:action_id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnsQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorReturnsReceiveItemsActionSchema),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReturn.entryPoint,
        filterField: 'return_id'
      })
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/returns/:id/receive-items/:action_id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReturnsParams,
        vendorReturnsQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReturn.entryPoint,
        filterField: 'return_id'
      })
    ]
  }
]
