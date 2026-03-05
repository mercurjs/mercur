import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CollectionMediaInput } from "@mercurjs/framework";
import { COLLECTION_DETAILS_MODULE } from "../../../modules/collection-details";
import CollectionDetailsModuleService from "../../../modules/collection-details/service";

export const upsertCollectionDetailMediaStepId = "upsert-collection-detail-media";

type MediaFieldValue = CollectionMediaInput | string | null | undefined;

export type UpsertCollectionDetailMediaInput = {
    collection_detail_id: string;
    thumbnail?: MediaFieldValue;
    icon?: MediaFieldValue;
    banner?: MediaFieldValue;
};

type ResolvedMediaIds = {
    thumbnail_id?: string | null;
    icon_id?: string | null;
    banner_id?: string | null;
};

type CompensationData = {
    created_media_ids: string[];
};

export const upsertCollectionDetailMediaStep = createStep(
    upsertCollectionDetailMediaStepId,
    async (input: UpsertCollectionDetailMediaInput, { container }): Promise<StepResponse<ResolvedMediaIds, CompensationData>> => {
        const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);
        const { collection_detail_id, thumbnail, icon, banner } = input;

        const createdMediaIds: string[] = [];
        const resolvedIds: ResolvedMediaIds = {};

        const resolveMediaField = async (
            field: MediaFieldValue,
            fieldName: 'thumbnail_id' | 'icon_id' | 'banner_id'
        ): Promise<void> => {
            if (field === undefined) {
                return;
            }

            if (field === null) {
                resolvedIds[fieldName] = null;
                return;
            }

            if (typeof field === 'string') {
                resolvedIds[fieldName] = field;
                return;
            }

            const newMedia = await service.createCollectionMedias({
                url: field.url,
                alt_text: field.alt_text,
                collection_detail_id,
            });

            createdMediaIds.push(newMedia.id);
            resolvedIds[fieldName] = newMedia.id;
        };

        await resolveMediaField(thumbnail, 'thumbnail_id');
        await resolveMediaField(icon, 'icon_id');
        await resolveMediaField(banner, 'banner_id');

        return new StepResponse(resolvedIds, { created_media_ids: createdMediaIds });
    },
    async (compensationData: CompensationData, { container }) => {
        if (!compensationData?.created_media_ids?.length) {
            return;
        }

        const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);

        await service.deleteCollectionMedias(compensationData.created_media_ids);
    }
);

