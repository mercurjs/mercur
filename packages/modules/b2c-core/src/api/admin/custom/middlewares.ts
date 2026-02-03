import { MiddlewareRoute } from "@medusajs/framework";

import { adminProductVariantsFilteredMiddlewares } from "./product-variants/middlewares";

export const adminCustomMiddlewares: MiddlewareRoute[] = [
  ...adminProductVariantsFilteredMiddlewares,
];
