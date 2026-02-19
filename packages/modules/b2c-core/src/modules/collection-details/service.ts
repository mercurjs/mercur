import { Context, SoftDeleteReturn } from "@medusajs/framework/types";
import { MedusaContext, MedusaService } from "@medusajs/framework/utils";

import { CollectionDetail } from "./models/collection-detail";
import { CollectionMedia } from "./models/collection-media";

type CollectionDetailType = {
    id: string;
    rank: number;
    thumbnail_id: string | null;
    icon_id: string | null;
    banner_id: string | null;
};

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

    async getNextRank(
        @MedusaContext() sharedContext?: Context
    ): Promise<number> {
        const allDetails = await this.listCollectionDetails(
            {},
            { select: ["rank"], order: { rank: "DESC" }, take: 1 },
            sharedContext
        );

        if (allDetails.length === 0) {
            return 0;
        }

        return allDetails[0].rank + 1;
    }

    async createCollectionDetailWithRank(
        data: {
            thumbnail_id?: string | null;
            icon_id?: string | null;
            banner_id?: string | null;
            rank?: number;
        },
        @MedusaContext() sharedContext?: Context
    ) {
        const nextRank = await this.getNextRank(sharedContext);

        const [minRankItem] = await this.listCollectionDetails(
            {},
            { select: ["rank"], order: { rank: "ASC" }, take: 1 },
            sharedContext
        ) as CollectionDetailType[];
        const minRank = minRankItem?.rank ?? 0;

        let rank = data.rank ?? nextRank;

        if (rank > nextRank) {
            rank = nextRank;
        }
        if (rank < minRank) {
            rank = minRank;
        }

        if (rank < nextRank) {
            await this.rerankAfterCreation(rank, sharedContext);
        }

        return this.createCollectionDetails({
            ...data,
            rank,
        }, sharedContext);
    }

    async updateCollectionDetailRank(
        id: string,
        newRank: number,
        @MedusaContext() sharedContext?: Context
    ) {
        const detail = await this.retrieveCollectionDetail(id, {}, sharedContext) as CollectionDetailType;
        const originalRank = detail.rank;

        if (originalRank === newRank) {
            return detail;
        }

        const [minRankItem] = await this.listCollectionDetails(
            {},
            { select: ["rank"], order: { rank: "ASC" }, take: 1 },
            sharedContext
        ) as CollectionDetailType[];

        const [maxRankItem] = await this.listCollectionDetails(
            {},
            { select: ["rank"], order: { rank: "DESC" }, take: 1 },
            sharedContext
        ) as CollectionDetailType[];

        const minRank = minRankItem?.rank ?? 0;
        const maxRank = maxRankItem?.rank ?? 0;

        if (newRank > maxRank) {
            newRank = maxRank;
        }
        if (newRank < minRank) {
            newRank = minRank;
        }

        await this.rerankAllItems(originalRank, newRank, sharedContext);

        return this.updateCollectionDetails({ id, rank: newRank }, sharedContext);
    }

    async bulkUpdateRanks(
        orderedIds: string[],
        @MedusaContext() sharedContext?: Context
    ) {
        const updates = orderedIds.map((id, index) => ({
            id,
            rank: index,
        }));

        return this.updateCollectionDetails(updates, sharedContext);
    }

    private async rerankAfterCreation(
        insertedRank: number,
        @MedusaContext() sharedContext?: Context
    ) {
        const affectedItems = await this.listCollectionDetails(
            { rank: { $gte: insertedRank } },
            { select: ["id", "rank"], order: { rank: "ASC" } },
            sharedContext
        ) as CollectionDetailType[];

        if (affectedItems.length === 0) {
            return;
        }

        const updates = affectedItems.map(item => ({
            id: item.id,
            rank: item.rank + 1,
        }));

        await this.updateCollectionDetails(updates, sharedContext);
    }

    async rerankAfterDeletion(
        deletedRank: number,
        @MedusaContext() sharedContext?: Context
    ) {
        const affectedItems = await this.listCollectionDetails(
            { rank: { $gt: deletedRank } },
            { select: ["id", "rank"], order: { rank: "ASC" } },
            sharedContext
        ) as CollectionDetailType[];

        if (affectedItems.length === 0) {
            return;
        }

        const updates = affectedItems.map(item => ({
            id: item.id,
            rank: item.rank - 1,
        }));

        await this.updateCollectionDetails(updates, sharedContext);
    }

    private async rerankAllItems(
        originalRank: number,
        newRank: number,
        @MedusaContext() sharedContext?: Context
    ) {
        if (originalRank === newRank) {
            return;
        }

        if (originalRank < newRank) {
            const affectedItems = await this.listCollectionDetails(
                {
                    rank: { $gt: originalRank, $lte: newRank }
                },
                { select: ["id", "rank"], order: { rank: "ASC" } },
                sharedContext
            ) as CollectionDetailType[];

            const updates = affectedItems.map(item => ({
                id: item.id,
                rank: item.rank - 1,
            }));

            await this.updateCollectionDetails(updates, sharedContext);
        } else {
            const affectedItems = await this.listCollectionDetails(
                {
                    rank: { $gte: newRank, $lt: originalRank }
                },
                { select: ["id", "rank"], order: { rank: "ASC" } },
                sharedContext
            ) as CollectionDetailType[];

            const updates = affectedItems.map(item => ({
                id: item.id,
                rank: item.rank + 1,
            }));

            await this.updateCollectionDetails(updates, sharedContext);
        }
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