import { MiddlewareRoute } from '@medusajs/framework';

import { attributeMiddlewares } from './attributes/middlewares';
import { configurationMiddleware } from './configuration/middlewares';
import { adminCustomMiddlewares } from './custom/middlewares';
import { adminVendorInventoryMiddlewares } from './inventory-items-vendor/middlewares';
import { orderSetsMiddlewares } from './order-sets/middlewares';
import { adminOrdersMiddlewares } from './orders/middlewares';
import { adminProductsMiddlewares } from './products/middlewares';
import { adminVendorReservationsMiddlewares } from './reservations-vendor/middlewares';
import { adminReservationsMiddlewares } from './reservations/middlewares';
import { sellerMiddlewares } from './sellers/middlewares';

export const adminMiddlewares: MiddlewareRoute[] = [
  ...orderSetsMiddlewares,
  ...configurationMiddleware,
  ...sellerMiddlewares,
  ...attributeMiddlewares,
  ...adminProductsMiddlewares,
  ...adminCustomMiddlewares,
  ...adminOrdersMiddlewares,
  ...adminReservationsMiddlewares,
  ...adminVendorInventoryMiddlewares,
  ...adminVendorReservationsMiddlewares
];
