import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { DeleteWishlistDTO } from "@mercurjs/framework";
import { WISHLIST_MODULE } from "../../../modules/wishlist";

export const deleteWishlistEntryStep = createStep(
  "delete-wishlist",
  async (input: DeleteWishlistDTO, { container }) => {
    const { id, reference_id } = input;
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    await link.dismiss([
      {
        [WISHLIST_MODULE]: {
          wishlist_id: id,
        },
        [Modules.PRODUCT]: {
          product_id: reference_id,
        },
      },
    ]);

    return new StepResponse({ id, reference_id });
  }
);
