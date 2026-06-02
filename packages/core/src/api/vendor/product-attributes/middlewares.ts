import {
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorProductAttributeQueryConfig } from "./query-config"
import {
  VendorGetProductAttributeParams,
  VendorGetProductAttributesParams,
} from "./validators"

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

const filterByCategoryLink = maybeApplyLinkFilter({
  entryPoint: "category_owning_attribute",
  resourceId: "product_attribute_id",
  filterableField: "product_category_id",
})

export const vendorProductAttributesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/product-attributes",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductAttributesParams,
        vendorProductAttributeQueryConfig.list
      ),
      renameCategoryIdFilter,
      filterByCategoryLink,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/product-attributes/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductAttributeParams,
        vendorProductAttributeQueryConfig.retrieve
      ),
    ],
  },
]
