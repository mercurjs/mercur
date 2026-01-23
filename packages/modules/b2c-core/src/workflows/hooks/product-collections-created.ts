import { createCollectionsWorkflow } from "@medusajs/medusa/core-flows";
import { COLLECTION_DETAILS_MODULE } from "../../modules/collection-details";
import CollectionDetailsModuleService from "../../modules/collection-details/service";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

createCollectionsWorkflow.hooks.collectionsCreated(async ({ collections }, { container }) => {
    const service = container.resolve<CollectionDetailsModuleService>(COLLECTION_DETAILS_MODULE);
    const nextRank = await service.getNextRank();
    
    const collectionDetail = await service.createCollectionDetails(collections.map((_, index) => ({
        media: [],
        thumbnail_id: null,
        icon_id: null,
        banner_id: null,
        rank: nextRank + index
    })));

    const link = container.resolve(ContainerRegistrationKeys.LINK);
    await link.create(collections.map((collection, index) => ({
        [Modules.PRODUCT]: {
            product_collection_id: collection.id,
        },
        [COLLECTION_DETAILS_MODULE]: {
            collection_detail_id: collectionDetail[index].id,
        },
    })));
});