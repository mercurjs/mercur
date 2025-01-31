import { NextFunction } from 'express'

import {
  MedusaRequest,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import sellerRequest from '../../../links/seller-request'
import { ConfigurationRuleType } from '../../../modules/configuration/types'
import {
  checkConfigurationRule,
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { vendorRequestsConfig } from './query-config'
import {
  VendorCreateRequest,
  VendorCreateRequestType,
  VendorGetRequestsParams
} from './validators'

const canVendorRequestProduct = () => {
  return (
    req: MedusaRequest<VendorCreateRequestType>,
    _,
    next: NextFunction
  ) => {
    if (req.validatedBody.request.type === 'product') {
      return checkConfigurationRule(
        ConfigurationRuleType.PRODUCT_REQUEST_ENABLED,
        true
      )
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
      filterBySellerId()
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
      ),
      canVendorRequestProduct()
    ]
  }
]
