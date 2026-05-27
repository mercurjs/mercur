import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // `applyVisibleSellerIdsFilter` + `maybeApplyLinkFilter` resolves the
  // visible product set onto `req.filterableFields.id`. The URL id must be
  // a member of that set; otherwise the seller-visibility constraint is
  // bypassed and a suspended/closed seller's product would leak through.
  const visibleIds = (req.filterableFields as { id?: unknown }).id
  if (Array.isArray(visibleIds) && !visibleIds.includes(req.params.id)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`,
    )
  }

  // region_id / currency_code are consumed by setPricingContext only —
  // the Product entity has neither column, so passing them through
  // raises `Trying to query by not existing property Product.region_id`.
  const {
    region_id: _r,
    currency_code: _c,
    ...productFilters
  } = (req.filterableFields ?? {}) as Record<string, unknown>

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { ...productFilters, id: req.params.id },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`,
    )
  }

  res.json({ product })
}
