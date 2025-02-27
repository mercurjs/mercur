import { NextFunction } from 'express'

import {
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MedusaError } from '@medusajs/framework/utils'

import sellerRequest from '../../../links/seller-request'
import { ConfigurationRuleType } from '../../../modules/configuration/types'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId,
  getRuleValue
} from '../../../shared/infra/http/middlewares'
import { applyRequestsStatusFilter } from '../../../shared/infra/http/middlewares/apply-request-status-filter'
import { applyRequestsTypeFilter } from '../../../shared/infra/http/middlewares/apply-request-type-filter'
import { vendorRequestsConfig } from './query-config'
import {
  VendorCreateRequest,
  VendorCreateRequestType,
  VendorGetRequestsParams
} from './validators'

const canVendorRequestProduct = () => {
  return async (
    req: MedusaRequest<VendorCreateRequestType>,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    if (
      req.validatedBody.request.type === 'product' &&
      !(await getRuleValue(
        req.scope,
        ConfigurationRuleType.PRODUCT_REQUEST_ENABLED
      ))
    ) {
      res.status(403).json({
        message: `This feature is disabled!`,
        type: MedusaError.Types.NOT_ALLOWED
      })
      return
    }
    return next()
  }
}

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
    matcher: '/vendor/requests',
    middlewares: [
      validateAndTransformBody(VendorCreateRequest),
      validateAndTransformQuery(
        VendorGetRequestsParams,
        vendorRequestsConfig.retrieve
      ),
      canVendorRequestProduct()
    ]
  }
]
