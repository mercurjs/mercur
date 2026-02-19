import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { createStep } from "@medusajs/framework/workflows-sdk";

import { CreateReviewDTO } from "../../../modules/reviews";
import orderReview from "../../../links/order-review";
import { Query } from "@medusajs/framework";

export const validateReviewStep = createStep(
  "validate-review",
  async (reviewToCreate: CreateReviewDTO, { container }) => {
    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY);

    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id"],
      filters: {
        id: reviewToCreate.order_id,
        customer_id: reviewToCreate.customer_id,
      },
    });

    if (!order) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Order not found!");
    }

    const { data } = await query.graph({
      entity: orderReview.entryPoint,
      fields: ["review.reference", "review.product.id", "review.seller.id"],
      filters: {
        order_id: reviewToCreate.order_id,
      },
    });

    const reviews = data.map((relation) => relation.review);

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
      );
    }
  }
);
