import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import CollectionDetailsModuleService from "../../../modules/collection-details/service";
import { COLLECTION_DETAILS_MODULE } from "../../../modules/collection-details";

export const createCollectionDetailStepId = "create-collection-detail";

export const createCollectionDetailStep = createStep(
    createCollectionDetailStepId,
    async (_: any, { container }) => {
        const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);

        const collectionDetail = await service.createCollectionDetails({
            media: [],
            thumbnail_id: null,
            icon_id: null,
            banner_id: null,
            rank: 0,
        });

        return new StepResponse(collectionDetail, collectionDetail.id);
    },
    async (id: string, { container }) => {
        const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);
        await service.deleteCollectionDetails(id);
    }
);