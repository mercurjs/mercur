import { NextFunction } from 'express';

import { MiddlewareRoute } from '@medusajs/framework';

import { canDeleteReservation } from '../../vendor/reservations/middlewares';

export const adminReservationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['DELETE'],
    matcher: '/admin/reservations/:id',
    middlewares: [canDeleteReservation()]
  }
];
