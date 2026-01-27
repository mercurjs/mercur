import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";
import { CATEGORY_DETAILS_MODULE } from "../../modules/category-details";
import CategoryDetailsModuleService from "../../modules/category-details/service";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

createProductCategoriesWorkflow.hooks.categoriesCreated(async ({ categories }, { container }) => {
    const service = container.resolve<CategoryDetailsModuleService>(CATEGORY_DETAILS_MODULE);

    const categoryDetail = await service.createCategoryDetails(categories.map(() => ({
        media: [],
        thumbnail_id: null,
        icon_id: null,
        banner_id: null,
    })));

    const link = container.resolve(ContainerRegistrationKeys.LINK);
    await link.create(categories.map((category, index) => ({
        [Modules.PRODUCT]: {
            product_category_id: category.id,
        },
        [CATEGORY_DETAILS_MODULE]: {
            category_detail_id: categoryDetail[index].id,
        },
    })));
});
