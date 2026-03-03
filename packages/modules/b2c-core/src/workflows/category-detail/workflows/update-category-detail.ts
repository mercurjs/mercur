import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { upsertCategoryDetailMediaStep } from "../steps/upsert-category-detail-media";
import { upsertCategoryDetailGalleryStep } from "../steps/upsert-category-detail-gallery";
import { updateCategoryDetailStep } from "../steps/update-category-detail";

type CategoryMediaInput = {
    url: string;
    alt_text?: string;
};

export type UpdateCategoryDetailWorkflowInput = {
    category_detail_id: string;
    thumbnail?: CategoryMediaInput | string | null;
    icon?: CategoryMediaInput | string | null;
    banner?: CategoryMediaInput | string | null;
    media?: {
        create: CategoryMediaInput[];
        delete: string[];
    };
};

export const updateCategoryDetailWorkflow = createWorkflow(
    'update-category-detail',
    function (input: UpdateCategoryDetailWorkflowInput) {
        const { category_detail_id, thumbnail, icon, banner, media } = input;

        const resolvedMediaIds = upsertCategoryDetailMediaStep({
            category_detail_id,
            thumbnail,
            icon,
            banner,
        });

        upsertCategoryDetailGalleryStep({
            category_detail_id,
            media,
        });

        const updatePayload = transform(
            { category_detail_id, resolvedMediaIds },
            ({ category_detail_id, resolvedMediaIds }) => {
                return {
                    id: category_detail_id,
                    ...(resolvedMediaIds.thumbnail_id !== undefined && { thumbnail_id: resolvedMediaIds.thumbnail_id }),
                    ...(resolvedMediaIds.icon_id !== undefined && { icon_id: resolvedMediaIds.icon_id }),
                    ...(resolvedMediaIds.banner_id !== undefined && { banner_id: resolvedMediaIds.banner_id }),
                };
            }
        );

        const updatedCategoryDetail = updateCategoryDetailStep(updatePayload);

        return new WorkflowResponse(updatedCategoryDetail);
    }
);

