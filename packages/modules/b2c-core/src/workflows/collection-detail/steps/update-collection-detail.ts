import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COLLECTION_DETAILS_MODULE } from "../../../modules/collection-details";
import CollectionDetailsModuleService from "../../../modules/collection-details/service";

export const updateCollectionDetailStepId = "update-collection-detail";

export type UpdateCollectionDetailStepInput = {
    id: string;
    thumbnail_id?: string | null;
    icon_id?: string | null;
    banner_id?: string | null;
    rank?: number;
};

export const updateCollectionDetailStep = createStep(
    updateCollectionDetailStepId,
    async (input: UpdateCollectionDetailStepInput, { container }) => {
        const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);

        const previousData = await service.retrieveCollectionDetail(input.id);

        const collectionDetail = await service.updateCollectionDetails(input);

        return new StepResponse(collectionDetail, previousData);
    },
    async (previousData, { container }) => {
        if (!previousData) {
            return;
        }

        const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);

        await service.updateCollectionDetails({
            id: previousData.id,
            thumbnail_id: previousData.thumbnail_id,
            icon_id: previousData.icon_id,
            banner_id: previousData.banner_id,
            rank: previousData.rank,
        });
    }
);
