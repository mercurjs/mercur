import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'

import { filterBySellerId } from '../../../shared/infra/http/middlewares'
import { vendorReservationQueryConfig } from './query-config'
import { VendorGetReservationParams } from './validators'

export const vendorReservationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/reservations',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReservationParams,
        vendorReservationQueryConfig.list
      ),
      filterBySellerId()
    ]
  }
]
