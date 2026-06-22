import {
  applyDefaultFilters,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, isPresent } from "@medusajs/framework/utils"
import { validateAndTransformQuery } from "@medusajs/framework"

import { storeProductQueryConfig } from "./query-config"
import {
  StoreGetProductParams,
  StoreGetProductsParams,
} from "./validators"
import { SellerStatus, ProductStatus } from "@mercurjs/types"

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

/**
 * Resolve sellers that are currently OPEN and not within an active
 * closure window, then expose their IDs as `seller_id` so the link
 * filter below can translate it into a product-id constraint via the
 * `product_seller` join entity.
 */
async function applyVisibleSellerIdsFilter(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const now = new Date()

  const { data: visibleSellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: {
      status: SellerStatus.OPEN,
      $and: [
        { $or: [{ closed_from: null }, { closed_from: { $gt: now } }] },
        { $or: [{ closed_to: null }, { closed_to: { $lt: now } }] },
      ],
    },
  })

  req.filterableFields ??= {}
  req.filterableFields.seller_id = visibleSellers.map(
    (s: { id: string }) => s.id
  )

  next()
}

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
      applyVisibleSellerIdsFilter,
      maybeApplyLinkFilter({
        entryPoint: "product_seller",
        resourceId: "product_id",
        filterableField: "seller_id",
      }),
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
    ],
  },
]
