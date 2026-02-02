import { Modules } from "@medusajs/framework/utils";
import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createRemoteLinkStep, removeRemoteLinkStep } from "@medusajs/medusa/core-flows";
import { FEATURED_COLLECTION_MODULE } from "../../../modules/featured_collection";
import { verifyProductsStatusStep } from "../steps/verify-products-status-step";
import { UpdateFeaturedCollectionDTO } from "@mercurjs/framework";
import { updateFeaturedCollectionStep } from "../steps/update-featured-collection-step";

const updateFeaturedCollectionWorkflowId = "update-featured-collection";

export type UpdateFeaturedCollectionWorkflowInput = UpdateFeaturedCollectionDTO;

export const updateFeaturedCollectionWorkflow = createWorkflow(updateFeaturedCollectionWorkflowId, (input: UpdateFeaturedCollectionWorkflowInput) => {
    // const products = transform({ input }, ({ input }) => {
    //     console.log("input", input);
    //     return input.products
    // });
    verifyProductsStatusStep(input.products);

    const featuredCollection = updateFeaturedCollectionStep(input);

    removeRemoteLinkStep([{
        [FEATURED_COLLECTION_MODULE]: {
            featured_collection_id: input.id,
        },
    }]);

    const linkDefinitions = transform({ input, featuredCollection }, ({ input, featuredCollection }) => {
        return input.products.map((product) => ({
            [Modules.PRODUCT]: {
                product_id: product.product_id,
            },
            [FEATURED_COLLECTION_MODULE]: {
                featured_collection_id: featuredCollection.id,
            },
            data: {
                position: product.position,
            }
        }));
    });

    createRemoteLinkStep(linkDefinitions);

    return new WorkflowResponse(featuredCollection);
});