import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { FEATURED_COLLECTION_MODULE } from "../../../modules/featured_collection";
import FeaturedCollectionModuleService from "../../../modules/featured_collection/service";

export const deleteFeaturedCollectionStepId =
    "delete-featured-collection-step";

export const deleteFeaturedCollectionStep = createStep(deleteFeaturedCollectionStepId, async (id: string, { container }) => {
    const service = container.resolve<FeaturedCollectionModuleService>(FEATURED_COLLECTION_MODULE);

    const featuredCollection = await service.retrieveFeaturedCollection(id);

    await service.deleteFeaturedCollections(id);

    return new StepResponse(id, { deleted_featured_collection: featuredCollection });

}, async (compensation: { deleted_featured_collection }, { container }) => {
    const service = container.resolve<FeaturedCollectionModuleService>(FEATURED_COLLECTION_MODULE);
    await service.createFeaturedCollections(compensation.deleted_featured_collection);
});