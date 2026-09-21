import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { ProductStatus, StoreReviewListResponse } from "@mercurjs/types"

import { StoreGetPublicReviewsParamsType } from "../../../reviews/validators"

export const GET = async (
  req: MedusaRequest<StoreGetPublicReviewsParamsType>,
  res: MedusaResponse<StoreReviewListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: {
      id: req.params.id,
      status: ProductStatus.PUBLISHED,
    },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id: ${req.params.id} was not found`
    )
  }

  const { data: reviews, metadata } = await query.graph({
    entity: "review",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    reviews,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}
