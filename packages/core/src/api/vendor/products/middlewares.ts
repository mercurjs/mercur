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
  VendorBatchProductAttributes,
  VendorCancelProductChange,
  VendorCreateProduct,
  VendorGetProductAttributeParams,
  VendorGetProductAttributesParams,
  VendorGetProductParams,
  VendorGetProductsParams,
  VendorGetProductVariantParams,
  VendorGetProductVariantsParams,
  VendorUpdateProduct,
  VendorUpdateProductAttribute,
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

/**
 * Scopes the product list to products the active seller has at least one
 * offer on, when `?has_offer=true`. The bare vendor-products list returns
 * the master-catalogue union (every published product + the seller's
 * own), which is far larger than the Offers surface; this narrows it to
 * the seller's offered products by resolving their offers' variant ids
 * and filtering products to those carrying one of those variants. The
 * `has_offer` pseudo-filter is consumed here and removed so it never
 * reaches the product graph read.
 */
const applySellerOfferedProductsFilter = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields ??= {}
  const hasOffer = req.filterableFields.has_offer
  delete req.filterableFields.has_offer

  if (hasOffer !== true) {
    return next()
  }

  const sellerId = req.seller_context!.seller_id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: ["variant_id"],
    filters: { seller_id: sellerId },
  })

  const variantIds = Array.from(
    new Set(
      offers
        .map((offer: { variant_id: string | null }) => offer.variant_id)
        .filter((id: string | null): id is string => Boolean(id))
    )
  )

  const existingAnd = (req.filterableFields.$and as object[] | undefined) ?? []
  req.filterableFields.$and = [
    ...existingAnd,
    // No offers → match nothing (empty list) rather than the whole catalogue.
    { variants: { id: variantIds.length ? variantIds : ["__none__"] } },
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
      applySellerOfferedProductsFilter,
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
    middlewares: [
      validateAndTransformBody(VendorAddProductVariant),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
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
    middlewares: [
      validateAndTransformBody(VendorAddProductAttribute),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },

  // --- /vendor/products/:id/attributes/batch ---
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
    method: ["POST"],
    matcher: "/vendor/products/:id/attributes/:attribute_id",
    middlewares: [
      validateAndTransformBody(VendorUpdateProductAttribute),
      validateAndTransformQuery(
        VendorGetProductParams,
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
