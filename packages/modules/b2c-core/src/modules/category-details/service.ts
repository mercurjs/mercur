import { Context, SoftDeleteReturn } from "@medusajs/framework/types";
import { MedusaContext, MedusaService } from "@medusajs/framework/utils";

import { CategoryDetail } from "./models/category-detail";
import { CategoryMedia } from "./models/category-media";

class CategoryDetailsModuleService extends MedusaService({
    CategoryDetail,
    CategoryMedia,
}) {

    async softDeleteCategoryMediasWithCleanup<TReturnableLinkableKeys extends string>(
        ids: string | string[],
        config?: SoftDeleteReturn<TReturnableLinkableKeys>,
        @MedusaContext() sharedContext?: Context
    ) {
        const mediaIds = Array.isArray(ids) ? ids : [ids];
        await this.clearMediaReferences(mediaIds, sharedContext);
        return this.softDeleteCategoryMedias(mediaIds, config, sharedContext);
    }

    async deleteCategoryMediasWithCleanup(
        ids: string | string[],
        @MedusaContext() sharedContext?: Context
    ) {
        const mediaIds = Array.isArray(ids) ? ids : [ids];
        await this.clearMediaReferences(mediaIds, sharedContext);
        return this.deleteCategoryMedias(mediaIds, sharedContext);
    }

    private async clearMediaReferences(
        mediaIds: string[],
        @MedusaContext() sharedContext?: Context
    ) {
        const categoryDetails = await this.listCategoryDetails(
            {
                $or: [
                    { thumbnail_id: mediaIds },
                    { icon_id: mediaIds },
                    { banner_id: mediaIds },
                ],
            },
            {},
            sharedContext
        );

        for (const detail of categoryDetails) {
            const updates: Record<string, null> = {};

            if (detail.thumbnail_id && mediaIds.includes(detail.thumbnail_id)) {
                updates.thumbnail_id = null;
            }
            if (detail.icon_id && mediaIds.includes(detail.icon_id)) {
                updates.icon_id = null;
            }
            if (detail.banner_id && mediaIds.includes(detail.banner_id)) {
                updates.banner_id = null;
            }

            if (Object.keys(updates).length > 0) {
                await this.updateCategoryDetails(
                    { id: detail.id, ...updates },
                    sharedContext
                );
            }
        }
    }
}

export default CategoryDetailsModuleService;
