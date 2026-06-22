import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

import { vendorProductVariantsQueryConfig } from "./query-config"
import { VendorGetProductVariantsParams } from "./validators"

/**
 * Vendors see variants that belong to either a published master-catalog
 * product or one of their own products in any state. Variants on another
 * vendor's unpublished products (draft / proposed / requires_action /
 * rejected) stay hidden.
 */
const applySellerProductVariantFilter = async (
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
        { product: { status: ProductStatus.PUBLISHED } },
        { product_id: sellerProductIds },
      ],
    },
  ]

  return next()
}

export const vendorProductVariantsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/product-variants",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductVariantsParams,
        vendorProductVariantsQueryConfig.list
      ),
      applySellerProductVariantFilter,
    ],
  },
]
