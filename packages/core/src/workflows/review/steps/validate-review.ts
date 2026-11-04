import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep } from "@medusajs/framework/workflows-sdk"
import { Query } from "@medusajs/framework"
import { CreateReviewDTO } from "@mercurjs/types"

import orderReview from "../../../links/order-review"

export const validateReviewStep = createStep(
  "validate-review",
  async (reviewToCreate: CreateReviewDTO, { container }) => {
    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)

    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "items.product_id", "seller.id"],
      filters: {
        id: reviewToCreate.order_id,
        customer_id: reviewToCreate.customer_id,
      },
    })

    if (!order) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Order not found!")
    }

    const referenceBelongsToOrder =
      reviewToCreate.reference === "seller"
        ? order.seller?.id === reviewToCreate.reference_id
        : (order.items ?? []).some(
            (item) => item?.product_id === reviewToCreate.reference_id
          )

    if (!referenceBelongsToOrder) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `${reviewToCreate.reference} ${reviewToCreate.reference_id} is not part of order ${reviewToCreate.order_id}`
      )
    }

    const { data } = await query.graph({
      entity: orderReview.entryPoint,
      fields: ["review.reference", "review.product.id", "review.seller.id"],
      filters: {
        order_id: reviewToCreate.order_id,
      },
    })

    const reviews = data.map((relation) => relation.review)

    if (
      reviews.some(
        (rev) =>
          rev.reference === reviewToCreate.reference &&
          rev[rev.reference].id === reviewToCreate.reference_id
      )
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Review already exists"
      )
    }
  }
)
