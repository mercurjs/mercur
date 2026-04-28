import {
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import {
  adminProductQueryConfig,
  adminProductVariantQueryConfig,
} from "./query-config"
import {
  adminProductAttributeQueryConfig,
} from "../product-attributes/query-config"
import {
  AdminCreateProductAttribute,
  AdminGetProductAttributeParams,
  AdminGetProductAttributesParams,
  AdminUpdateProductAttribute,
} from "../product-attributes/validators"
import {
  AdminBatchProductAttributes,
  AdminBatchUpdateProducts,
  AdminCreateProduct,
  AdminCreateProductVariant,
  AdminGetProductParams,
  AdminGetProductsParams,
  AdminGetProductVariantParams,
  AdminGetProductVariantsParams,
  AdminRejectProduct,
  AdminRequestProductChanges,
  AdminUpdateProduct,
  AdminUpdateProductVariant,
} from "./validators"

export const adminProductsMiddlewares: MiddlewareRoute[] = [
  // --- CRUD ---
  {
    method: ["GET"],
    matcher: "/admin/products",
    middlewares: [
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
    method: ["POST"],
    matcher: "/admin/products/batch",
    middlewares: [
      validateAndTransformBody(AdminBatchUpdateProducts),
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

  // --- Variant sub-resource ---
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

  // --- Attribute sub-resource ---
  {
    method: ["POST"],
    matcher: "/admin/products/:id/attributes/batch",
    middlewares: [
      validateAndTransformBody(AdminBatchProductAttributes),
      validateAndTransformQuery(
        AdminGetProductAttributesParams,
        adminProductAttributeQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/products/:id/attributes",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductAttributesParams,
        adminProductAttributeQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/attributes",
    middlewares: [
      validateAndTransformBody(AdminCreateProductAttribute),
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/products/:id/attributes/:attribute_id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/attributes/:attribute_id",
    middlewares: [
      validateAndTransformBody(AdminUpdateProductAttribute),
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/products/:id/attributes/:attribute_id",
    middlewares: [],
  },
]
