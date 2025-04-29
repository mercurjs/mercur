import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import sellerRequest from '../../../links/seller-request'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { applyRequestsStatusFilter } from '../../../shared/infra/http/middlewares/apply-request-status-filter'
import { applyRequestsTypeFilter } from '../../../shared/infra/http/middlewares/apply-request-type-filter'
import { vendorRequestsConfig } from './query-config'
import {
  VendorCreateRequest,
  VendorGetRequestsParams,
  VendorUpdateRequestData
} from './validators'

export const vendorRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/requests',
    middlewares: [
      validateAndTransformQuery(
        VendorGetRequestsParams,
        vendorRequestsConfig.list
      ),
      filterBySellerId(),
      applyRequestsStatusFilter(),
      applyRequestsTypeFilter()
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/requests/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetRequestsParams,
        vendorRequestsConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerRequest.entryPoint,
        filterField: 'request_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/requests/:id',
    middlewares: [
      validateAndTransformBody(VendorUpdateRequestData),
      validateAndTransformQuery(
        VendorGetRequestsParams,
        vendorRequestsConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerRequest.entryPoint,
        filterField: 'request_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/requests',
    middlewares: [
      validateAndTransformBody(VendorCreateRequest),
      validateAndTransformQuery(
        VendorGetRequestsParams,
        vendorRequestsConfig.retrieve
      )
    ]
  }
]
