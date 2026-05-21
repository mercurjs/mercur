import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse,
) => {
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

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { ...req.filterableFields, id: req.params.id },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`,
    )
  }

  res.json({ product })
}
