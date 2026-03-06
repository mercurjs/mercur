import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework';
import { createBatchBody } from '@medusajs/medusa/api/utils/validators';

import { canDeleteReservation } from '../../vendor/reservations/middlewares';
import { adminReservationQueryConfig } from './query-config';
import {
  AdminBatchUpdateReservation,
  AdminCreateReservation,
  AdminGetReservationParams
} from './validators';

export const adminReservationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['DELETE'],
    matcher: '/admin/reservations/:id',
    middlewares: [canDeleteReservation()]
  },
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
];
