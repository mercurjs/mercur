import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { FEATURED_COLLECTION_MODULE } from "../../../modules/featured_collection";
import FeaturedCollectionModuleService from "../../../modules/featured_collection/service";
import { toHandle } from "@medusajs/framework/utils";
import { UpdateFeaturedCollectionDTO } from "@mercurjs/framework";

export const updateFeaturedCollectionStepId =
    "update-featured-collection-step";

export type UpdateFeaturedCollectionStepInput = UpdateFeaturedCollectionDTO;

export const updateFeaturedCollectionStep = createStep(updateFeaturedCollectionStepId, async (input: UpdateFeaturedCollectionStepInput, { container }) => {
    const service = container.resolve<FeaturedCollectionModuleService>(FEATURED_COLLECTION_MODULE);

    const collectionHandle = input.handle ?? toHandle(input.name);

    const featuredCollection = await service.updateFeaturedCollections({
        ...input,
        handle: collectionHandle
    });

    return new StepResponse(featuredCollection);
});