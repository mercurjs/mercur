import { MiddlewareRoute } from "@medusajs/framework";

import { attributeMiddlewares } from "./attributes/middlewares";
import { configurationMiddleware } from "./configuration/middlewares";
import { adminCustomMiddlewares } from "./custom/middlewares";
import { adminOrdersMiddlewares } from "./orders/middlewares";
import { orderSetsMiddlewares } from "./order-sets/middlewares";
import { adminProductsMiddlewares } from "./products/middlewares";
import { sellerMiddlewares } from "./sellers/middlewares";
import { adminReservationsMiddlewares } from "./reservations/middlewares";

export const adminMiddlewares: MiddlewareRoute[] = [
  ...orderSetsMiddlewares,
  ...configurationMiddleware,
  ...sellerMiddlewares,
  ...attributeMiddlewares,
  ...adminProductsMiddlewares,
  ...adminCustomMiddlewares,
  ...adminOrdersMiddlewares,
  ...adminReservationsMiddlewares
];
