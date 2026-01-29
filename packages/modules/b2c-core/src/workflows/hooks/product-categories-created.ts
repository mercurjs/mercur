import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";
import { CATEGORY_DETAILS_MODULE } from "../../modules/category-details";
import CategoryDetailsModuleService from "../../modules/category-details/service";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { z } from "zod";
import { updateCategoryDetailWorkflow } from "../category-detail";

createProductCategoriesWorkflow.hooks.categoriesCreated(async (input, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const service = container.resolve<CategoryDetailsModuleService>(CATEGORY_DETAILS_MODULE);

    const categoryDetail = await service.createCategoryDetails(input.categories.map(() => ({
        media: [],
        thumbnail_id: null,
        icon_id: null,
        banner_id: null,
    })));

    const link = container.resolve(ContainerRegistrationKeys.LINK);
    await link.create(input.categories.map((category, index) => ({
        [Modules.PRODUCT]: {
            product_category_id: category.id,
        },
        [CATEGORY_DETAILS_MODULE]: {
            category_detail_id: categoryDetail[index].id,
        },
    })));

    if (input.additional_data?.details) {
        try {
            const detailsSchema = z.object({
                thumbnail: z.string().nullable().default(null),
                icon: z.string().nullable().default(null),
                banner: z.string().nullable().default(null),
            });

            const details = detailsSchema.parse(input.additional_data.details);

            for (const category of categoryDetail) {
                await updateCategoryDetailWorkflow.run({
                    container,
                    input: {
                        category_detail_id: category.id,
                        thumbnail: details.thumbnail ? { url: details.thumbnail, alt_text: null } : null,
                        icon: details.icon ? { url: details.icon, alt_text: null } : null,
                        banner: details.banner ? { url: details.banner, alt_text: null } : null,
                    }
                });
            }
        } catch {
            logger.warn('Failed to update category details');
        }
    }
});
