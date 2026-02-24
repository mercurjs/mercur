import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import CollectionDetailsModuleService from "../../../modules/collection-details/service";
import { COLLECTION_DETAILS_MODULE } from "../../../modules/collection-details";

export const createCollectionDetailStepId = "create-collection-detail";

export type CreateCollectionDetailStepInput = {
    rank?: number;
};

export const createCollectionDetailStep = createStep(
    createCollectionDetailStepId,
    async (input: CreateCollectionDetailStepInput | undefined, { container }) => {
        const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);

        const collectionDetail = await service.createCollectionDetailWithRank({
            thumbnail_id: null,
            icon_id: null,
            banner_id: null,
            rank: input?.rank,
        });

        return new StepResponse(collectionDetail, collectionDetail.id);
    },
    async (id: string, { container }) => {
        const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);
        const detail = await service.retrieveCollectionDetail(id);
        await service.deleteCollectionDetails(id);
        await service.rerankAfterDeletion(detail.rank);
    }
);