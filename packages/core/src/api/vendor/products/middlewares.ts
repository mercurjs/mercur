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

import { vendorProductQueryConfig } from "./query-config"
import {
  VendorAddProductAttribute,
  VendorAddProductVariant,
  VendorCreateProduct,
  VendorGetProductAttributeParams,
  VendorGetProductAttributesParams,
  VendorGetProductParams,
  VendorGetProductsParams,
  VendorGetProductVariantParams,
  VendorGetProductVariantsParams,
  VendorUpdateProduct,
  VendorUpdateProductVariant,
} from "./validators"

const applySellerProductLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.seller_context?.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "product_seller",
    resourceId: "product_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorProductsMiddlewares: MiddlewareRoute[] = [
  // --- /vendor/products ---
  {
    method: ["GET"],
    matcher: "/vendor/products",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductsParams,
        vendorProductQueryConfig.list
      ),
      applySellerProductLinkFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products",
    middlewares: [
      validateAndTransformBody(VendorCreateProduct),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },

  // --- /vendor/products/:id ---
  {
    method: ["GET"],
    matcher: "/vendor/products/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id",
    middlewares: [validateAndTransformBody(VendorUpdateProduct)],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/products/:id",
    middlewares: [],
  },

  // --- /vendor/products/:id/variants ---
  {
    method: ["GET"],
    matcher: "/vendor/products/:id/variants",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductVariantsParams,
        vendorProductQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id/variants",
    middlewares: [validateAndTransformBody(VendorAddProductVariant)],
  },

  // --- /vendor/products/:id/variants/:variant_id ---
  {
    method: ["GET"],
    matcher: "/vendor/products/:id/variants/:variant_id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductVariantParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id/variants/:variant_id",
    middlewares: [validateAndTransformBody(VendorUpdateProductVariant)],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/products/:id/variants/:variant_id",
    middlewares: [],
  },

  // --- /vendor/products/:id/attributes ---
  {
    method: ["GET"],
    matcher: "/vendor/products/:id/attributes",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductAttributesParams,
        vendorProductQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id/attributes",
    middlewares: [validateAndTransformBody(VendorAddProductAttribute)],
  },

  // --- /vendor/products/:id/attributes/:attribute_id ---
  {
    method: ["GET"],
    matcher: "/vendor/products/:id/attributes/:attribute_id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductAttributeParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/products/:id/attributes/:attribute_id",
    middlewares: [],
  },
]
