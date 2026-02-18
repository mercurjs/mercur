import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import sellerReview from "../../../links/seller-review"

export const validateSellerReview = async (
  scope: MedusaContainer,
  sellerId: string,
  reviewId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerReviewLink],
  } = await query.graph({
    entity: sellerReview.entryPoint,
    filters: {
      seller_id: sellerId,
      review_id: reviewId,
    },
    fields: ["seller_id", "review_id"],
  })

  if (!sellerReviewLink) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Review with id: ${reviewId} was not found`
    )
  }
}
