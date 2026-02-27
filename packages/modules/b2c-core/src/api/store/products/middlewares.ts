import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";

import { filterNullProductsMiddleware } from "../../../shared/infra/http/middlewares";
import { StoreSearchProductsSchema } from "./validators";

export const storeProductsMiddlewares: MiddlewareRoute[] = [
  {
    methods: ["GET"],
    matcher: "/store/products",
    middlewares: [filterNullProductsMiddleware],
  },
  {
    methods: ["POST"],
    matcher: "/store/products/search",
    middlewares: [
      validateAndTransformBody(StoreSearchProductsSchema),
      filterNullProductsMiddleware,
    ],
  },
];
