import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  isPresent,
  QueryContext,
} from "@medusajs/framework/utils";

import customerWishlist from "../../../links/customer-wishlist";
import { createWishlistEntryWorkflow } from "../../../workflows/wishlist/workflows/create-wishlist";
import { StoreCreateWishlistType } from "./validators";
import { ProductDTO } from "@mercurjs/types";

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateWishlistType>,
  res: MedusaResponse
) => {
  const { result } = await createWishlistEntryWorkflow.run({
    container: req.scope,
    input: {
      ...req.validatedBody,
      customer_id: req.auth_context.actor_id,
    },
  });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [wishlist],
  } = await query.graph({
    entity: "wishlist",
    fields: req.queryConfig.fields,
    filters: {
      id: result.id,
    },
  });

  res.status(201).json({ wishlist });
};

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const customerId = req.auth_context.actor_id;

  const {
    data: [wishlist],
  } = await query.graph({
    entity: customerWishlist.entryPoint,
    fields: ["wishlist.products.id"],
    filters: {
      customer_id: customerId,
    },
  });

  const productIds: string[] = [];
  wishlist.wishlist.products.forEach((product: ProductDTO) => {
    productIds.push(product.id);
  });

  let context: object = {};

  if (isPresent(req.pricingContext)) {
    const pricingContext = { ...req.pricingContext, customer_id: customerId };
    context = {
      variants: {
        calculated_price: QueryContext(pricingContext),
      },
    };
  }

  const { data: products, metadata } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: {
      id: productIds,
    },
    pagination: req.queryConfig.pagination,
    context,
  });

  res.json({
    products,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take,
  });
};
