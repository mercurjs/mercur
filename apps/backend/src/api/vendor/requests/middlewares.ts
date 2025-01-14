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
import { applyRequestsFilterableFields } from '../../../shared/infra/http/middlewares/apply-requests-filterable-fields'
import { vendorRequestsConfig } from './query-config'
import { VendorCreateRequest, VendorGetRequestsParams } from './validators'

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
      applyRequestsFilterableFields()
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
        entryPoint: sellerRequest.entryPoint
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
