import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
    policies: [
      {
        resource: PolicyResource.product_attribute,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.product_attribute,
        operation: PolicyOperation.create,
      },
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
    policies: [
      {
        resource: PolicyResource.product_attribute,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.product_attribute,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/product-attributes/:id",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.product_attribute,
        operation: PolicyOperation.delete,
      },
    ],
  },

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
    policies: [
      {
        resource: PolicyResource.product_attribute,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.product_attribute,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.product_attribute,
        operation: PolicyOperation.delete,
      },
    ],
  },
]
