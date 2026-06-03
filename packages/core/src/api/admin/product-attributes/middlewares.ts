import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { filterAttributesByCategoryLinkOrGlobal } from "../../utils"
import { adminProductAttributeQueryConfig } from "./query-config"
import {
  AdminCreateProductAttribute,
  AdminGetProductAttributeParams,
  AdminGetProductAttributesParams,
  AdminUpdateProductAttribute,
  AdminUpdateProductAttributeValue,
  AdminUpsertProductAttributeValues,
} from "./validators"

const applyAttributeFilters = (req, _, next) => {
  req.filterableFields = req.filterableFields ?? {}
  req.filterableFields.product_id = null
  next()
}

// The link pivot's FK column is `product_category_id` (derived from the
// productCategory linkable key), not `category_id`. Map the URL filter
// to the column the link service actually exposes.
const renameCategoryIdFilter = (
  req: MedusaRequest,
  _: MedusaResponse,
  next: MedusaNextFunction
) => {
  const categoryId = req.filterableFields?.category_id
  if (categoryId !== undefined) {
    req.filterableFields.product_category_id = categoryId
    delete req.filterableFields.category_id
  }
  return next()
}

export const adminProductAttributesMiddlewares: MiddlewareRoute[] = [
  // --- /admin/product-attributes ---
  {
    method: ["GET"],
    matcher: "/admin/product-attributes",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductAttributesParams,
        adminProductAttributeQueryConfig.list
      ),
      applyAttributeFilters,
      renameCategoryIdFilter,
      filterAttributesByCategoryLinkOrGlobal,
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-attributes",
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
    matcher: "/admin/product-attributes/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-attributes/:id",
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
    matcher: "/admin/product-attributes/:id",
    middlewares: [],
  },

  // --- /admin/product-attributes/:id/values ---
  {
    method: ["POST"],
    matcher: "/admin/product-attributes/:id/values",
    middlewares: [
      validateAndTransformBody(AdminUpsertProductAttributeValues),
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-attributes/:id/values/:value_id",
    middlewares: [
      validateAndTransformBody(AdminUpdateProductAttributeValue),
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/product-attributes/:id/values/:value_id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
]
