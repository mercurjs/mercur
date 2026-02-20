import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk";

import { CreateWishlistDTO } from "../../../modules/wishlist";
import { createWishlistEntryStep } from "../steps/create-wishlist";

export const createWishlistEntryWorkflow = createWorkflow(
  {
    name: "create-wishlist",
  },
  function (input: CreateWishlistDTO) {
    return new WorkflowResponse(createWishlistEntryStep(input));
  }
);
