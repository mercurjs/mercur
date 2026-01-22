import { Context, SoftDeleteReturn } from "@medusajs/framework/types";
import { MedusaContext, MedusaService } from "@medusajs/framework/utils";

import { CollectionDetail } from "./models/collection-detail";
import { CollectionMedia } from "./models/collection-media";

class CollectionDetailsModuleService extends MedusaService({
    CollectionDetail,
    CollectionMedia,
}) {

    async softDeleteCollectionMediasWithCleanup<TReturnableLinkableKeys extends string>(
        ids: string | string[],
        config?: SoftDeleteReturn<TReturnableLinkableKeys>,
        @MedusaContext() sharedContext?: Context
    ) {
        const mediaIds = Array.isArray(ids) ? ids : [ids];
        await this.clearMediaReferences(mediaIds, sharedContext);
        return this.softDeleteCollectionMedias(mediaIds, config, sharedContext);
    }


    async deleteCollectionMediasWithCleanup(
        ids: string | string[],
        @MedusaContext() sharedContext?: Context
    ) {
        const mediaIds = Array.isArray(ids) ? ids : [ids];
        await this.clearMediaReferences(mediaIds, sharedContext);
        return this.deleteCollectionMedias(mediaIds, sharedContext);
    }

    private async clearMediaReferences(
        mediaIds: string[],
        @MedusaContext() sharedContext?: Context
    ) {
        const collectionDetails = await this.listCollectionDetails(
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

        for (const detail of collectionDetails) {
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
                await this.updateCollectionDetails(
                    { id: detail.id, ...updates },
                    sharedContext
                );
            }
        }
    }
}

export default CollectionDetailsModuleService;