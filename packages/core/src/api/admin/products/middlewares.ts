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
  AdminGetProductAttributeParams,
  AdminGetProductAttributesParams,
  AdminUpdateProductAttribute,
} from "../product-attributes/validators"
import {
  AdminAddProductAttribute,
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
  //
  // POST endpoints return the parent product, so they use the product
  // retrieve query config. GET list returns product attributes, so it
  // uses the attribute list config.
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
      validateAndTransformBody(AdminAddProductAttribute),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
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
