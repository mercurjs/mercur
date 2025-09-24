import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { filterBySellerId } from '../../../shared/infra/http/middlewares'
import { vendorPayoutAccountQueryConfig } from './query-config'
import {
  VendorCreateOnboarding,
  VendorCreatePayoutAccount,
  VendorGetPayoutAccountParams
} from './validators'

export const vendorPayoutAccountMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/payout-account',
    middlewares: [
      validateAndTransformQuery(
        VendorGetPayoutAccountParams,
        vendorPayoutAccountQueryConfig.retrieve
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/payout-account',
    middlewares: [
      validateAndTransformBody(VendorCreatePayoutAccount),
      validateAndTransformQuery(
        VendorGetPayoutAccountParams,
        vendorPayoutAccountQueryConfig.retrieve
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/payout-account/onboarding',
    middlewares: [
      validateAndTransformBody(VendorCreateOnboarding),
      validateAndTransformQuery(
        VendorGetPayoutAccountParams,
        vendorPayoutAccountQueryConfig.retrieve
      )
    ]
  }
]
