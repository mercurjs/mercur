import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";

import { deleteWishlistEntryWorkflow } from "../../../../../workflows/wishlist/workflows/delete-wishlist";
import { getWishlistFromCustomerId } from "../../../../../modules/wishlist/utils";

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const wishlist = await getWishlistFromCustomerId(
    req.scope,
    req.auth_context.actor_id
  );

  if (!wishlist) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Wishlist not found for current customer"
    );
  }

  await deleteWishlistEntryWorkflow.run({
    container: req.scope,
    input: {
      id: wishlist.id,
      reference_id: req.params.reference_id,
    },
  });

  res.json({
    id: wishlist.id,
    reference_id: req.params.reference_id,
    object: "wishlist",
    deleted: true,
  });
};
