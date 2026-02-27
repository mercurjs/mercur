import { MiddlewareRoute } from "@medusajs/framework";

import { adminProductVariantsFilteredMiddlewares } from "./product-variants/middlewares";
import { adminCustomStockLocationsMiddlewares } from "./stock-locations/middlewares";

export const adminCustomMiddlewares: MiddlewareRoute[] = [
  ...adminProductVariantsFilteredMiddlewares,
  ...adminCustomStockLocationsMiddlewares,
];
