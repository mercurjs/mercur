import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import customerReview from "../../../links/customer-review"

export const validateCustomerReview = async (
  scope: MedusaContainer,
  customerId: string,
  reviewId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [customerReviewLink],
  } = await query.graph({
    entity: customerReview.entryPoint,
    filters: {
      customer_id: customerId,
      review_id: reviewId,
    },
    fields: ["customer_id", "review_id"],
  })

  if (!customerReviewLink) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Review with id: ${reviewId} was not found`
    )
  }
}
