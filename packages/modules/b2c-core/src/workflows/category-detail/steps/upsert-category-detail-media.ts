import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CATEGORY_DETAILS_MODULE } from "../../../modules/category-details";
import CategoryDetailsModuleService from "../../../modules/category-details/service";

export const upsertCategoryDetailMediaStepId = "upsert-category-detail-media";

type CategoryMediaInput = {
    url: string;
    alt_text?: string;
};

type MediaFieldValue = CategoryMediaInput | string | null | undefined;

export type UpsertCategoryDetailMediaInput = {
    category_detail_id: string;
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

export const upsertCategoryDetailMediaStep = createStep(
    upsertCategoryDetailMediaStepId,
    async (input: UpsertCategoryDetailMediaInput, { container }): Promise<StepResponse<ResolvedMediaIds, CompensationData>> => {
        const service = container.resolve<CategoryDetailsModuleService>(CATEGORY_DETAILS_MODULE);
        const { category_detail_id, thumbnail, icon, banner } = input;

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

            const newMedia = await service.createCategoryMedias({
                url: field.url,
                alt_text: field.alt_text,
                category_detail_id,
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

        const service = container.resolve<CategoryDetailsModuleService>(CATEGORY_DETAILS_MODULE);

        await service.deleteCategoryMedias(compensationData.created_media_ids);
    }
);

