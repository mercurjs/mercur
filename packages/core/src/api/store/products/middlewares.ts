import {
  applyDefaultFilters,
  authenticate,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, isPresent } from "@medusajs/framework/utils"
import { validateAndTransformQuery } from "@medusajs/framework"
import {
  filterByValidSalesChannels,
  normalizeDataForContext,
  setPricingContext,
  setTaxContext,
} from "@medusajs/medusa/api/utils/middlewares/index"

import { storeProductQueryConfig } from "./query-config"
import {
  StoreGetProductParams,
  StoreGetProductsParams,
} from "./validators"
import { ProductStatus } from "@mercurjs/types"

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
 * Translate global product-attribute filters (`attributes[<handle>]=v1,v2`)
 * into native variant-option filters. Every filterable global attribute is a
 * variant axis backed by a Medusa `ProductOption`, so its selected values live
 * on `variants.options.value`. Each attribute becomes its own `$and` clause
 * (AND across attributes), while multiple values within one attribute are OR'd.
 */
function transformAttributeFilters(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const filters = (req.filterableFields ??= {}) as Record<string, unknown>
  const attributes = filters.attributes as
    | Record<string, string | string[]>
    | undefined
  delete filters.attributes

  if (!attributes) {
    return next()
  }

  const clauses = Object.values(attributes)
    .map((value) =>
      (Array.isArray(value) ? value : String(value).split(","))
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
    .filter((values) => values.length > 0)
    .map((values) => ({ variants: { options: { value: values } } }))

  if (clauses.length > 0) {
    const existing = Array.isArray(filters.$and)
      ? (filters.$and as unknown[])
      : []
    filters.$and = [...existing, ...clauses]
  }

  next()
}

/**
 * Scope products to the publishable key's sales channels, as vanilla
 * `/store/products` does. Vendor-submitted products are not linked to a sales
 * channel on creation, so the link filter only kicks in once the store runs
 * more than one channel — mirroring Medusa's own list route — and the detail
 * route is gated the same way instead of 404-ing every unlinked product.
 */
async function applySalesChannelLinkFilter(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { metadata } = await query.graph({
    entity: "sales_channels",
    fields: ["id"],
    pagination: { skip: 0, take: 1 },
  })

  if (!((metadata?.count ?? 0) > 1)) {
    delete req.filterableFields.sales_channel_id
    return next()
  }

  return maybeApplyLinkFilter({
    entryPoint: "product_sales_channel",
    resourceId: "product_id",
    filterableField: "sales_channel_id",
  })(req, res, next)
}

const salesChannelMiddlewares = [
  filterByValidSalesChannels(),
  applySalesChannelLinkFilter,
]

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
      ...salesChannelMiddlewares,
      applyProductFilters,
      transformAttributeFilters,
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
      ...salesChannelMiddlewares,
      applyProductFilters,
      ...pricingMiddlewares,
    ],
  },
]
