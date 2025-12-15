import { MiddlewareRoute } from "@medusajs/framework";

import { attributeMiddlewares } from "./attributes/middlewares";
import { configurationMiddleware } from "./configuration/middlewares";
import { orderSetsMiddlewares } from "./order-sets/middlewares";
import { adminProductVariantsFilteredMiddlewares } from "./product-variants-filtered/middlewares";
import { adminProductsMiddlewares } from "./products/middlewares";
import { sellerMiddlewares } from "./sellers/middlewares";

export const adminMiddlewares: MiddlewareRoute[] = [
  ...orderSetsMiddlewares,
  ...configurationMiddleware,
  ...sellerMiddlewares,
  ...attributeMiddlewares,
  ...adminProductsMiddlewares,
  ...adminProductVariantsFilteredMiddlewares,
];
