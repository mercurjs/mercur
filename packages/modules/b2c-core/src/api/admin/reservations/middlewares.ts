import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import { adminReservationQueryConfig } from './query-config'
import {
  AdminCreateReservations,
  AdminGetReservationParams
} from './validators'

export const adminReservationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['POST'],
    matcher: '/admin/reservations/batch',
    middlewares: [
      validateAndTransformBody(AdminCreateReservations),
      validateAndTransformQuery(
        AdminGetReservationParams,
        adminReservationQueryConfig.retrieve
      )
    ]
  }
]
