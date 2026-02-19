import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import CategoryDetailsModuleService from "../../../modules/category-details/service";
import { CATEGORY_DETAILS_MODULE } from "../../../modules/category-details";

export const createCategoryDetailStepId = "create-category-detail";

export const createCategoryDetailStep = createStep(
    createCategoryDetailStepId,
    async (_: unknown, { container }) => {
        const service = container.resolve<CategoryDetailsModuleService>(CATEGORY_DETAILS_MODULE);

        const categoryDetail = await service.createCategoryDetails({
            thumbnail_id: null,
            icon_id: null,
            banner_id: null,
        });

        return new StepResponse(categoryDetail, categoryDetail.id);
    },
    async (id: string, { container }) => {
        const service = container.resolve<CategoryDetailsModuleService>(CATEGORY_DETAILS_MODULE);
        await service.deleteCategoryDetails(id);
    }
);
