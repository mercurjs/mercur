import { MiddlewareRoute } from "@medusajs/framework/http"

import { excludePendingRequestEntities } from "./helpers"

export const storeRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/product-categories",
    middlewares: [excludePendingRequestEntities("product_category")],
  },
  {
    method: ["GET"],
    matcher: "/store/collections",
    middlewares: [excludePendingRequestEntities("product_collection")],
  },
  {
    method: ["GET"],
    matcher: "/store/product-tags",
    middlewares: [excludePendingRequestEntities("product_tag")],
  },
  {
    method: ["GET"],
    matcher: "/store/product-types",
    middlewares: [excludePendingRequestEntities("product_type")],
  },
]
