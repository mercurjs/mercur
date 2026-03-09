import { MiddlewareRoute } from "@medusajs/framework/http"

import { excludePendingRequestEntities } from "./helpers"

export const vendorEntityFilterMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/product-categories",
    middlewares: [excludePendingRequestEntities("product_category")],
  },
  {
    method: ["GET"],
    matcher: "/vendor/collections",
    middlewares: [excludePendingRequestEntities("product_collection")],
  },
  {
    method: ["GET"],
    matcher: "/vendor/product-tags",
    middlewares: [excludePendingRequestEntities("product_tag")],
  },
  {
    method: ["GET"],
    matcher: "/vendor/product-types",
    middlewares: [excludePendingRequestEntities("product_type")],
  },
]
