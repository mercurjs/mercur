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

export const adminProductsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/products",
    middlewares: [
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
    matcher: "/admin/products/:id/confirm",
    middlewares: [
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
    method: ["GET"],
    matcher: "/admin/products/:id/variants",
    middlewares: [
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
    middlewares: [validateAndTransformBody(createLinkBody())],
  },
]
