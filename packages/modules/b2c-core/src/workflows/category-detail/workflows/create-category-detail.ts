import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createCategoryDetailStep } from "../steps/create-category-detail";
import { Modules } from "@medusajs/framework/utils";
import { CATEGORY_DETAILS_MODULE } from "../../../modules/category-details";
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";


export const createCategoryDetailWorkflow = createWorkflow(
    'create-category-detail',
    function ({ product_category_id }:
        { product_category_id: string }) {

        const createdCategoryDetail = createCategoryDetailStep();

        const link = transform({ createdCategoryDetail, product_category_id }, ({ createdCategoryDetail, product_category_id }) => {
            return [
                {
                    [Modules.PRODUCT]: {
                        product_category_id,
                    },
                    [CATEGORY_DETAILS_MODULE]: {
                        category_detail_id: createdCategoryDetail.id,
                    },
                }
            ]
        })

        createRemoteLinkStep(link);

        return new WorkflowResponse(createdCategoryDetail);
    }
)

