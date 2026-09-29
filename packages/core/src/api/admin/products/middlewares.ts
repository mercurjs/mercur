import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { createLinkBody } from "@medusajs/medusa/api/utils/validators"

import { applyOfferedProductsFilter } from "../../utils"
import {
  adminProductQueryConfig,
  adminProductVariantQueryConfig,
} from "./query-config"
import {
  AdminBatchProductAttributes,
  AdminBatchProducts,
  AdminCreateProduct,
  AdminCreateProductVariant,
  AdminGetProductParams,
  AdminGetProductsParams,
  AdminGetProductVariantParams,
  AdminGetProductVariantsParams,
  AdminConfirmProduct,
  AdminRejectProduct,
  AdminRequestProductChanges,
  AdminUpdateProduct,
  AdminUpdateProductVariant,
} from "./validators"
import { withOriginalMiddlewares } from "../../../utils/disable-medusa-middlewares"

const overrides: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/products",
    middlewares: [
      requirePermission("products", "view"),
      validateAndTransformQuery(
        AdminGetProductsParams,
        adminProductQueryConfig.list
      ),
      applyOfferedProductsFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products",
    middlewares: [
      requirePermission("products", "edit"),
      validateAndTransformBody(AdminCreateProduct),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/batch",
    middlewares: [
      requirePermission("products", "edit"),
      validateAndTransformBody(AdminBatchProducts),
      validateAndTransformQuery(
        AdminGetProductsParams,
        adminProductQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/products/:id",
    middlewares: [
      requirePermission("products", "view"),
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
      requirePermission("products", "edit"),
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
    middlewares: [
      requirePermission("products", "manage"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/confirm",
    middlewares: [
      requirePermission("products.review", "edit"),
      validateAndTransformBody(AdminConfirmProduct),
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
      requirePermission("products.review", "edit"),
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
      requirePermission("products.review", "edit"),
      validateAndTransformBody(AdminRejectProduct),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/products/:id/variants",
    middlewares: [
      requirePermission("products", "view"),
      validateAndTransformQuery(
        AdminGetProductVariantsParams,
        adminProductVariantQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/variants",
    middlewares: [
      requirePermission("products", "edit"),
      validateAndTransformBody(AdminCreateProductVariant),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/products/:id/variants/:variant_id",
    middlewares: [
      requirePermission("products", "view"),
      validateAndTransformQuery(
        AdminGetProductVariantParams,
        adminProductVariantQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/variants/:variant_id",
    middlewares: [
      requirePermission("products", "edit"),
      validateAndTransformBody(AdminUpdateProductVariant),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/products/:id/variants/:variant_id",
    middlewares: [
      requirePermission("products", "manage"),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },

  {
    method: ["POST"],
    matcher: "/admin/products/:id/attributes/batch",
    middlewares: [
      requirePermission("products", "edit"),
      validateAndTransformBody(AdminBatchProductAttributes),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },

  {
    method: ["POST"],
    matcher: "/admin/products/:id/sellers",
    middlewares: [
      requirePermission("products", "edit"),
      validateAndTransformBody(createLinkBody())],
  },
]

export const adminProductsMiddlewares = withOriginalMiddlewares(
  "dist/api/admin/products/middlewares.js",
  overrides
)
