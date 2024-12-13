import { filterBySellerId } from '#/shared/infra/http/middlewares'

import { validateAndTransformQuery } from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { vendorOnboardingQueryConfig } from './query-config'
import { VendorGetOnboardingParams } from './validators'

export const vendorOnboardingMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/onboarding',
    middlewares: [
      validateAndTransformQuery(
        VendorGetOnboardingParams,
        vendorOnboardingQueryConfig.retrieve
      ),
      filterBySellerId()
    ]
  }
]
