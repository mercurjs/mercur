import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { CreateFeaturedCollectionDTO } from "@mercurjs/framework";
import { FEATURED_COLLECTION_MODULE } from "../../../modules/featured_collection";
import FeaturedCollectionModuleService from "../../../modules/featured_collection/service";
import { toHandle } from "@medusajs/framework/utils";

export const createFeaturedCollectionStepId =
    "create-featured-collection-step";

export type CreateFeaturedCollectionStepInput = CreateFeaturedCollectionDTO;
export const createFeaturedCollectionStep = createStep(createFeaturedCollectionStepId, async (input: CreateFeaturedCollectionStepInput, { container }) => {
    const service = container.resolve<FeaturedCollectionModuleService>(FEATURED_COLLECTION_MODULE);

    const collectionHandle = input.handle ?? toHandle(input.name);

    const featuredCollection = await service.createFeaturedCollections({
        ...input,
        handle: collectionHandle,
    });

    return new StepResponse(featuredCollection, {
        ids: [featuredCollection.id],
    });
}, async (compensation: { ids: string[] }, { container }) => {
    const service = container.resolve<FeaturedCollectionModuleService>(FEATURED_COLLECTION_MODULE);
    await service.deleteFeaturedCollections(compensation.ids);
});