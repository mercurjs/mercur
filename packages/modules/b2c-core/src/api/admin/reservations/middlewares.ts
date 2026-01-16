import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { createBatchBody } from '@medusajs/medusa/api/utils/validators'

import { adminReservationQueryConfig } from './query-config'
import {
  AdminBatchUpdateReservation,
  AdminCreateReservation,
  AdminGetReservationParams
} from './validators'

export const adminReservationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['POST'],
    matcher: '/admin/reservations/batch',
    middlewares: [
      validateAndTransformBody(
        createBatchBody(AdminCreateReservation, AdminBatchUpdateReservation)
      ),
      validateAndTransformQuery(
        AdminGetReservationParams,
        adminReservationQueryConfig.retrieve
      )
    ]
  }
]
