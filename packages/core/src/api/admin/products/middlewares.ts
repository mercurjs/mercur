import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { adminProductQueryConfig } from "./query-config"
import {
  AdminCreateProduct,
  AdminGetProductParams,
  AdminGetProductsParams,
  AdminRejectProduct,
  AdminRequestProductChanges,
  AdminUpdateProduct,
} from "./validators"

// Filters products by seller_id via the product_seller link.
// Runs before `validateAndTransformQuery` on the list endpoint so the
// link-rewrite happens against the original `req.query.seller_id`.
const maybeApplySellerProductFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.query.seller_id) {
    return next()
  }

  req.filterableFields.seller_id = req.query.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "product_seller",
    resourceId: "product_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const adminProductsMiddlewares: MiddlewareRoute[] = [
  // --- CRUD ---
  {
    method: ["GET"],
    matcher: "/admin/products",
    middlewares: [
      maybeApplySellerProductFilter,
      validateAndTransformQuery(
        AdminGetProductsParams,
        adminProductQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products",
    middlewares: [
      validateAndTransformBody(AdminCreateProduct),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/products/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateProduct),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/products/:id",
    middlewares: [],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/accept",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/request-changes",
    middlewares: [
      validateAndTransformBody(AdminRequestProductChanges),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/reject",
    middlewares: [
      validateAndTransformBody(AdminRejectProduct),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/activate",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/deactivate",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
]
