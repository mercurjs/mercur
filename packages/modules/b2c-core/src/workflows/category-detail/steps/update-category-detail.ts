import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CATEGORY_DETAILS_MODULE } from "../../../modules/category-details";
import CategoryDetailsModuleService from "../../../modules/category-details/service";

export const updateCategoryDetailStepId = "update-category-detail";

export type UpdateCategoryDetailStepInput = {
    id: string;
    thumbnail_id?: string | null;
    icon_id?: string | null;
    banner_id?: string | null;
};

type PreviousData = {
    id: string;
    thumbnail_id: string | null;
    icon_id: string | null;
    banner_id: string | null;
};

export const updateCategoryDetailStep = createStep(
    updateCategoryDetailStepId,
    async (input: UpdateCategoryDetailStepInput, { container }) => {
        const service = container.resolve<CategoryDetailsModuleService>(CATEGORY_DETAILS_MODULE);

        const previousData = await service.retrieveCategoryDetail(input.id) as PreviousData;

        await service.updateCategoryDetails(input);

        const updatedDetail = await service.retrieveCategoryDetail(input.id);

        return new StepResponse(updatedDetail, previousData);
    },
    async (previousData, { container }) => {
        if (!previousData) {
            return;
        }

        const service = container.resolve<CategoryDetailsModuleService>(CATEGORY_DETAILS_MODULE);

        await service.updateCategoryDetails({
            id: previousData.id,
            thumbnail_id: previousData.thumbnail_id,
            icon_id: previousData.icon_id,
            banner_id: previousData.banner_id,
        });
    }
);
