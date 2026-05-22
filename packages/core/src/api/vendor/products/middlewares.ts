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
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

import {
  vendorProductQueryConfig,
  vendorProductVariantQueryConfig,
} from "./query-config"
import {
  VendorAddProductAttribute,
  VendorAddProductVariant,
  VendorCancelProductChange,
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

/**
 * Vendors see the union of the master catalog (any product with
 * `status = published`) and their own products in any state. Other
 * vendors' non-published products (draft / proposed / requires_action
 * / rejected) stay hidden so unreleased proposals from a competing
 * seller never leak into this list.
 */
const applySellerProductLinkFilter = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const sellerId = req.seller_context!.seller_id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: links } = await query.graph({
    entity: "product_seller",
    fields: ["product_id"],
    filters: { seller_id: sellerId },
  })

  const sellerProductIds = links
    .map((link: { product_id: string | null }) => link.product_id)
    .filter((id: string | null): id is string => Boolean(id))

  req.filterableFields ??= {}
  const existingAnd = (req.filterableFields.$and as object[] | undefined) ?? []
  req.filterableFields.$and = [
    ...existingAnd,
    {
      $or: [
        { status: ProductStatus.PUBLISHED },
        { id: sellerProductIds },
      ],
    },
  ]

  return next()
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

  // --- /vendor/products/:id/cancel ---
  {
    method: ["POST"],
    matcher: "/vendor/products/:id/cancel",
    middlewares: [validateAndTransformBody(VendorCancelProductChange)],
  },

  // --- /vendor/products/:id/variants ---
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
    middlewares: [validateAndTransformBody(VendorAddProductVariant)],
  },

  // --- /vendor/products/:id/variants/:variant_id ---
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
