import { createCollectionsWorkflow } from "@medusajs/medusa/core-flows";
import { COLLECTION_DETAILS_MODULE } from "../../modules/collection-details";
import CollectionDetailsModuleService from "../../modules/collection-details/service";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { z } from "zod";
import { updateCollectionDetailWorkflow } from "../collection-detail";

createCollectionsWorkflow.hooks.collectionsCreated(async (input, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);
    const nextRank = await service.getNextRank();

    const collectionDetail = await service.createCollectionDetails(input.collections.map((_, index) => ({
        media: [],
        thumbnail_id: null,
        icon_id: null,
        banner_id: null,
        rank: nextRank + index
    })));

    const link = container.resolve(ContainerRegistrationKeys.LINK);
    await link.create(input.collections.map((collection, index) => ({
        [Modules.PRODUCT]: {
            product_collection_id: collection.id,
        },
        [COLLECTION_DETAILS_MODULE]: {
            collection_detail_id: collectionDetail[index].id,
        },
    })));

    if (input.additional_data?.details) {
        try {
            const detailsSchema = z.object({
                thumbnail: z.string().nullable().default(null),
                icon: z.string().nullable().default(null),
                banner: z.string().nullable().default(null),
                rank: z.number().nullable().default(null),
            });

            const details = detailsSchema.parse(input.additional_data.details);

            for (const collection of collectionDetail) {
                await updateCollectionDetailWorkflow.run({
                    container,
                    input: {
                        collection_detail_id: collection.id,
                        thumbnail: details.thumbnail ? { url: details.thumbnail, alt_text: null } : null,
                        icon: details.icon ? { url: details.icon, alt_text: null } : null,
                        banner: details.banner ? { url: details.banner, alt_text: null } : null,
                        rank: details.rank,
                    }
                });
            }
        } catch {
            logger.warn('Failed to update collection details');
        }

    }
});