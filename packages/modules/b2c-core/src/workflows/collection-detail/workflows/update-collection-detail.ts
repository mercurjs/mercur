import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { UpdateCollectionDetailDTO } from "@mercurjs/framework";
import { upsertCollectionDetailMediaStep } from "../steps/upsert-collection-detail-media";
import { upsertCollectionDetailGalleryStep } from "../steps/upsert-collection-detail-gallery";
import { updateCollectionDetailStep } from "../steps/update-collection-detail";

export type UpdateCollectionDetailWorkflowInput = {
    collection_detail_id: string;
} & UpdateCollectionDetailDTO;

export const updateCollectionDetailWorkflow = createWorkflow(
    'update-collection-detail',
    function (input: UpdateCollectionDetailWorkflowInput) {
        const { collection_detail_id, thumbnail, icon, banner, media, rank } = input;

        const resolvedMediaIds = upsertCollectionDetailMediaStep({
            collection_detail_id,
            thumbnail,
            icon,
            banner,
        });

        upsertCollectionDetailGalleryStep({
            collection_detail_id,
            media,
        });

        const updatePayload = transform(
            { collection_detail_id, resolvedMediaIds, rank },
            ({ collection_detail_id, resolvedMediaIds, rank }) => {
                return {
                    id: collection_detail_id,
                    ...(resolvedMediaIds.thumbnail_id !== undefined && { thumbnail_id: resolvedMediaIds.thumbnail_id }),
                    ...(resolvedMediaIds.icon_id !== undefined && { icon_id: resolvedMediaIds.icon_id }),
                    ...(resolvedMediaIds.banner_id !== undefined && { banner_id: resolvedMediaIds.banner_id }),
                    ...(rank !== undefined && { rank }),
                };
            }
        );

        const updatedCollectionDetail = updateCollectionDetailStep(updatePayload);

        return new WorkflowResponse(updatedCollectionDetail);
    }
);

