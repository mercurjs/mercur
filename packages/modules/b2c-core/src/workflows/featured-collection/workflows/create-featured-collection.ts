import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { CreateFeaturedCollectionDTO } from "@mercurjs/framework";
import { createFeaturedCollectionStep } from "../steps/create-featured-collection-step";
import { verifyProductsStatusStep } from "../steps/verify-products-status-step";
import { FEATURED_COLLECTION_MODULE } from "../../../modules/featured_collection";
import { Modules } from "@medusajs/framework/utils";
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";

const createFeaturedCollectionWorkflowId = "create-featured-collection";

export type CreateFeaturedCollectionWorkflowInput = CreateFeaturedCollectionDTO;

export const createFeaturedCollectionWorkflow = createWorkflow(createFeaturedCollectionWorkflowId, (input: CreateFeaturedCollectionWorkflowInput) => {
    verifyProductsStatusStep(input.products);
    const featuredCollection = createFeaturedCollectionStep(input);

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