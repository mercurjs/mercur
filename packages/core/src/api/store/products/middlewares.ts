import {
  applyDefaultFilters,
  authenticate,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { isPresent } from "@medusajs/framework/utils"
import { validateAndTransformQuery } from "@medusajs/framework"
import {
  normalizeDataForContext,
  setPricingContext,
  setTaxContext,
} from "@medusajs/medusa/api/utils/middlewares/index"

import { storeProductQueryConfig } from "./query-config"
import {
  StoreGetProductParams,
  StoreGetProductsParams,
} from "./validators"
import { ProductStatus } from "@medusajs/framework/utils"
import {
  applyVisibleSellerProductScope,
  resolveVisibleSellerIds,
} from "../../utils/sellers"

/**
 * Apply the store-facing defaults that vanilla Medusa applies on its own
 * `/store/products` route. Besides forcing the `published` status, this
 * translates the Medusa-standard `category_id` query param into the
 * `categories` relation filter. The `Product` entity has no `category_id`
 * column, so passing it straight to `query.graph` raises
 * `Trying to query by not existing property Product.category_id` (#974).
 */
const applyProductFilters = applyDefaultFilters({
  status: ProductStatus.PUBLISHED,
  categories: (filters: Record<string, unknown>) => {
    const categoryIds = filters.category_id
    delete filters.category_id

    if (!isPresent(categoryIds)) {
      return
    }

    return { id: categoryIds, is_internal: false, is_active: true }
  },
})

async function applyVisibleSellerIdsFilter(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  req.filterableFields ??= {}
  req.filterableFields.seller_id = await resolveVisibleSellerIds(req.scope)

  next()
}

/**
 * Resolve the pricing/tax context consumed by the offer-price wrap. Reuses
 * Medusa's product-pricing middlewares so the gate matches vanilla
 * `/store/products`: prices compute only when the client requests
 * `variants.calculated_price` or passes `region_id`.
 */
const pricingMiddlewares = [
  authenticate("customer", ["session", "bearer"], {
    allowUnauthenticated: true,
  }),
  normalizeDataForContext({ priceFieldPaths: ["variants.calculated_price"] }),
  setPricingContext({ priceFieldPaths: ["variants.calculated_price"] }),
  setTaxContext({ priceFieldPaths: ["variants.calculated_price"] }),
]

export const storeProductsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/products",
    middlewares: [
      validateAndTransformQuery(
        StoreGetProductsParams,
        storeProductQueryConfig.list
      ),
      applyProductFilters,
      applyVisibleSellerProductScope,
      ...pricingMiddlewares,
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/products/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetProductParams,
        storeProductQueryConfig.retrieve
      ),
      applyProductFilters,
      applyVisibleSellerIdsFilter,
      maybeApplyLinkFilter({
        entryPoint: "product_seller",
        resourceId: "product_id",
        filterableField: "seller_id",
      }),
      ...pricingMiddlewares,
    ],
  },
]
