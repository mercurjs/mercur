import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import customerReview from "../../../links/customer-review";
import { createReviewWorkflow } from "../../../workflows/review/workflows";
import { StoreCreateReviewType, StoreGetReviewsParamsType } from "./validators";

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateReviewType>,
  res: MedusaResponse
) => {
  const { result } = await createReviewWorkflow.run({
    container: req.scope,
    input: {
      ...req.validatedBody,
      customer_id: req.auth_context.actor_id,
    },
  });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [review],
  } = await query.graph({
    entity: "review",
    fields: req.queryConfig.fields,
    filters: {
      id: result.id,
    },
  });

  res.status(201).json({ review });
};

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetReviewsParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: reviews, metadata } = await query.graph({
    entity: customerReview.entryPoint,
    fields: req.queryConfig.fields.map((field) => `review.${field}`),
    filters: {
      customer_id: req.auth_context.actor_id,
    },
    pagination: req.queryConfig.pagination,
  });

  res.json({
    reviews: reviews.map((relation) => relation.review),
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take,
  });
};
