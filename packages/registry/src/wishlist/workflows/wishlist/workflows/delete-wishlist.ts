import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk";

import { DeleteWishlistDTO } from "../../../modules/wishlist";
import { deleteWishlistEntryStep } from "../steps/delete-wishlist";

export const deleteWishlistEntryWorkflow = createWorkflow(
  {
    name: "delete-wishlist",
  },
  function (input: DeleteWishlistDTO) {
    return new WorkflowResponse(deleteWishlistEntryStep(input));
  }
);
