import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CATEGORY_DETAILS_MODULE } from "../../../modules/category-details";
import CategoryDetailsModuleService from "../../../modules/category-details/service";

export const upsertCategoryDetailGalleryStepId = "upsert-category-detail-gallery";

type CategoryMediaInput = {
    url: string;
    alt_text?: string;
};

export type UpsertCategoryDetailGalleryInput = {
    category_detail_id: string;
    media?: {
        create: CategoryMediaInput[];
        delete: string[];
    };
};

type CompensationData = {
    created_media_ids: string[];
    deleted_media_ids: string[];
};

export const upsertCategoryDetailGalleryStep = createStep(
    upsertCategoryDetailGalleryStepId,
    async (input: UpsertCategoryDetailGalleryInput, { container }): Promise<StepResponse<string[], CompensationData>> => {
        const service = container.resolve<CategoryDetailsModuleService>(CATEGORY_DETAILS_MODULE);
        const { category_detail_id, media } = input;

        if (!media) {
            return new StepResponse([], { created_media_ids: [], deleted_media_ids: [] });
        }

        const createdMediaIds: string[] = [];

        if (media.delete?.length) {
            await service.softDeleteCategoryMediasWithCleanup(media.delete);
        }

        if (media.create?.length) {
            const createdMedia = await service.createCategoryMedias(
                media.create.map((m) => ({
                    url: m.url,
                    alt_text: m.alt_text,
                    category_detail_id,
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

        const service = container.resolve<CategoryDetailsModuleService>(CATEGORY_DETAILS_MODULE);

        if (compensationData.deleted_media_ids?.length) {
            await service.restoreCategoryMedias(compensationData.deleted_media_ids);
        }

        if (compensationData.created_media_ids?.length) {
            await service.deleteCategoryMedias(compensationData.created_media_ids);
        }
    }
);

