import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createCollectionDetailStep } from "../steps/create-collection-detail";
import { Modules } from "@medusajs/framework/utils";
import { COLLECTION_DETAILS_MODULE } from "../../../modules/collection-details";
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";


export const createCollectionDetailWorkflow = createWorkflow(
    'create-collection-detail',
    function ({ product_collection_id }:
        { product_collection_id: string }) {

        const createdCollectionDetail = createCollectionDetailStep({});

        const link = transform({ createdCollectionDetail, product_collection_id }, ({ createdCollectionDetail, product_collection_id }) => {
            return [
                {
                    [Modules.PRODUCT]: {
                        product_collection_id,
                    },
                    [COLLECTION_DETAILS_MODULE]: {
                        collection_detail_id: createdCollectionDetail.id,
                    },
                }
            ]
        })

        createRemoteLinkStep(link);

        return new WorkflowResponse(createdCollectionDetail);
    }
)