import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { ProductStatus } from "@medusajs/framework/utils"

import { applyOfferedProductsFilter } from "../../utils"
import { getSellerOwnedProductIds } from "./helpers"
import {
  vendorProductQueryConfig,
  vendorProductVariantQueryConfig,
} from "./query-config"
import {
  VendorAddProductVariant,
  VendorBatchProductAttributes,
  VendorCancelProductChange,
  VendorCreateProduct,
  VendorGetProductParams,
  VendorGetProductsParams,
  VendorGetProductVariantParams,
  VendorGetProductVariantsParams,
  VendorUpdateProduct,
  VendorUpdateProductVariant,
} from "./validators"

const applySellerProductLinkFilter = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const sellerId = req.seller_context!.seller_id

  // Authorship is derived from the product-edit change pipeline, which is not
  // indexed, so it stays a prefetch. "Restricted to other sellers" is expressed
  // as a product↔seller relation filter instead: a published product is visible
  // when it has no seller restriction or is restricted to this seller.
  const ownProductIds = await getSellerOwnedProductIds(req.scope, sellerId)

  req.filterableFields ??= {}
  const existingAnd = (req.filterableFields.$and as object[] | undefined) ?? []
  req.filterableFields.$and = [
    ...existingAnd,
    {
      $or: [
        { id: ownProductIds },
        {
          status: ProductStatus.PUBLISHED,
          $or: [
            { seller: { id: { $is: null } } },
            { seller: { id: sellerId } },
          ],
        },
      ],
    },
  ]

  return next()
}

export const vendorProductsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/products",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductsParams,
        vendorProductQueryConfig.list
      ),
      applySellerProductLinkFilter,
      applyOfferedProductsFilter,
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
    middlewares: [
      validateAndTransformBody(VendorUpdateProduct),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/products/:id",
    middlewares: [],
  },

  {
    method: ["POST"],
    matcher: "/vendor/products/:id/cancel",
    middlewares: [validateAndTransformBody(VendorCancelProductChange)],
  },

  {
    method: ["GET"],
    matcher: "/vendor/products/:id/variants",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductVariantsParams,
        vendorProductVariantQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id/variants",
    middlewares: [
      validateAndTransformBody(VendorAddProductVariant),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },

  {
    method: ["GET"],
    matcher: "/vendor/products/:id/variants/:variant_id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductVariantParams,
        vendorProductVariantQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id/variants/:variant_id",
    middlewares: [
      validateAndTransformBody(VendorUpdateProductVariant),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/products/:id/variants/:variant_id",
    middlewares: [],
  },

  {
    method: ["POST"],
    matcher: "/vendor/products/:id/attributes/batch",
    middlewares: [
      validateAndTransformBody(VendorBatchProductAttributes),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },
]
