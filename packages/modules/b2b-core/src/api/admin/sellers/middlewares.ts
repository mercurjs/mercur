import {
  MiddlewareRoute,
  unlessPath,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { listProductQueryConfig } from '@medusajs/medusa/api/admin/products/query-config'

import {
  adminSellerOrdersQueryConfig,
  adminSellerQueryConfig
} from './query-config'
import {
  AdminGetSellerCustomerGroupsParams,
  AdminGetSellerOrdersParams,
  AdminGetSellerProductsParams,
  AdminInviteSeller,
  AdminSellerParams,
  AdminUpdateSeller
} from './validators'

export const sellerMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/admin/sellers',
    middlewares: [
      validateAndTransformQuery(AdminSellerParams, adminSellerQueryConfig.list)
    ]
  },
  {
    method: ['GET'],
    matcher: '/admin/sellers/:id',
    middlewares: [
      unlessPath(
        /.*\/sellers\/invite/,
        validateAndTransformQuery(
          AdminSellerParams,
          adminSellerQueryConfig.retrieve
        )
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/sellers/:id',
    middlewares: [
      unlessPath(
        /.*\/sellers\/invite/,
        validateAndTransformQuery(
          AdminSellerParams,
          adminSellerQueryConfig.retrieve
        )
      ),
      unlessPath(
        /.*\/sellers\/invite/,
        validateAndTransformBody(AdminUpdateSeller)
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/admin/sellers/:id/products',
    middlewares: [
      unlessPath(
        /.*\/sellers\/invite/,
        validateAndTransformQuery(
          AdminGetSellerProductsParams,
          listProductQueryConfig
        )
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/admin/sellers/:id/orders',
    middlewares: [
      unlessPath(
        /.*\/sellers\/invite/,
        validateAndTransformQuery(
          AdminGetSellerOrdersParams,
          adminSellerOrdersQueryConfig.list
        )
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/admin/sellers/:id/customer-groups',
    middlewares: [
      unlessPath(
        /.*\/sellers\/invite/,
        validateAndTransformQuery(
          AdminGetSellerCustomerGroupsParams,
          adminSellerOrdersQueryConfig.list
        )
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/sellers/invite',
    middlewares: [validateAndTransformBody(AdminInviteSeller)]
  }
]
