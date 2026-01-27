import {
  MiddlewareRoute,
  validateAndTransformQuery
} from '@medusajs/framework/http';

import { adminReservationQueryConfig } from './query-config';
import { AdminGetReservationsParams } from './validators';

export const adminReservationsVendorMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/admin/reservations-vendor',
    middlewares: [
      validateAndTransformQuery(
        AdminGetReservationsParams,
        adminReservationQueryConfig.list
      )
    ]
  }
];
