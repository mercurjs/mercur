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

type PreviousData = {
    id: string;
    thumbnail_id: string | null;
    icon_id: string | null;
    banner_id: string | null;
    rank: number;
};

export const updateCollectionDetailStep = createStep(
    updateCollectionDetailStepId,
    async (input: UpdateCollectionDetailStepInput, { container }) => {
        const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);

        const previousData = await service.retrieveCollectionDetail(input.id) as PreviousData;

        if (input.rank !== undefined && input.rank !== previousData.rank) {
            await service.updateCollectionDetailRank(input.id, input.rank);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { rank, ...otherUpdates } = input;
        if (Object.keys(otherUpdates).length > 1) {
            await service.updateCollectionDetails(otherUpdates);
        }

        const updatedDetail = await service.retrieveCollectionDetail(input.id);

        return new StepResponse(updatedDetail, previousData);
    },
    async (previousData, { container }) => {
        if (!previousData) {
            return;
        }

        const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);

        const currentData = await service.retrieveCollectionDetail(previousData.id) as PreviousData;
        if (currentData.rank !== previousData.rank) {
            await service.updateCollectionDetailRank(previousData.id, previousData.rank);
        }

        await service.updateCollectionDetails({
            id: previousData.id,
            thumbnail_id: previousData.thumbnail_id,
            icon_id: previousData.icon_id,
            banner_id: previousData.banner_id,
        });
    }
);
