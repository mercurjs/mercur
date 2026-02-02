import { Modules } from "@medusajs/framework/utils";
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createRemoteLinkStep, removeRemoteLinkStep } from "@medusajs/medusa/core-flows";
import { transform } from "typescript";
import { FEATURED_COLLECTION_MODULE } from "../../../modules/featured_collection";
import { createFeaturedCollectionStep } from "../steps/create-featured-collection-step";
import { verifyProductsStatusStep } from "../steps/verify-products-status-step";
import { deleteFeaturedCollectionStep } from "../steps/delete-featured-collection-step";

const deleteFeaturedCollectionWorkflowId = "delete-featured-collection";

export type DeleteFeaturedCollectionWorkflowInput = string;

export const deleteFeaturedCollectionWorkflow = createWorkflow(deleteFeaturedCollectionWorkflowId, (input: DeleteFeaturedCollectionWorkflowInput) => {

    deleteFeaturedCollectionStep(input);

    removeRemoteLinkStep([{
        [FEATURED_COLLECTION_MODULE]: {
            featured_collection_id: input,
        },
    }]);

    return new WorkflowResponse(input);
});