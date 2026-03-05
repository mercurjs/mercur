import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CollectionMediaInput } from "@mercurjs/framework";
import { COLLECTION_DETAILS_MODULE } from "../../../modules/collection-details";
import CollectionDetailsModuleService from "../../../modules/collection-details/service";

export const upsertCollectionDetailGalleryStepId = "upsert-collection-detail-gallery";

export type UpsertCollectionDetailGalleryInput = {
    collection_detail_id: string;
    media?: {
        create: CollectionMediaInput[];
        delete: string[];
    };
};

type CompensationData = {
    created_media_ids: string[];
    deleted_media_ids: string[];
};

export const upsertCollectionDetailGalleryStep = createStep(
    upsertCollectionDetailGalleryStepId,
    async (input: UpsertCollectionDetailGalleryInput, { container }): Promise<StepResponse<string[], CompensationData>> => {
        const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);
        const { collection_detail_id, media } = input;

        if (!media) {
            return new StepResponse([], { created_media_ids: [], deleted_media_ids: [] });
        }

        const createdMediaIds: string[] = [];

        if (media.delete?.length) {
            await service.softDeleteCollectionMediasWithCleanup(media.delete);
        }

        if (media.create?.length) {
            const createdMedia = await service.createCollectionMedias(
                media.create.map((m) => ({
                    url: m.url,
                    alt_text: m.alt_text,
                    collection_detail_id,
                }))
            );

            const mediaArray = Array.isArray(createdMedia) ? createdMedia : [createdMedia];
            createdMediaIds.push(...mediaArray.map((m) => m.id));
        }

        return new StepResponse(createdMediaIds, {
            created_media_ids: createdMediaIds,
            deleted_media_ids: media.delete ?? [],
        });
    },
    async (compensationData: CompensationData, { container }) => {
        if (!compensationData) {
            return;
        }

        const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);

        if (compensationData.deleted_media_ids?.length) {
            await service.restoreCollectionMedias(compensationData.deleted_media_ids);
        }

        if (compensationData.created_media_ids?.length) {
            await service.deleteCollectionMedias(compensationData.created_media_ids);
        }
    }
);

