import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductCategoriesWorkflow } from "@medusajs/core-flows"
import { upsertCustomFieldsStep } from "@mercurjs/core-plugin/workflows"

import { RequestStatus } from "../../../types"

type CreateProductCategoryRequestWorkflowInput = {
  product_category: {
    name: string
    handle?: string
    description?: string
    is_active?: boolean
    is_internal?: boolean
    parent_category_id?: string | null
    metadata?: Record<string, unknown>
  }
  submitter_id: string
}

export const createProductCategoryRequestWorkflow = createWorkflow(
  "create-product-category-request",
  function (input: CreateProductCategoryRequestWorkflowInput) {
    const categories = createProductCategoriesWorkflow.runAsStep({
      input: {
        product_categories: [input.product_category],
      },
    })

    const upsertInput = transform({ categories, input }, (data) => ({
      alias: "product_category",
      data: {
        id: data.categories[0]!.id,
        request_status: RequestStatus.PENDING,
        submitter_id: data.input.submitter_id,
      },
    }))

    upsertCustomFieldsStep(upsertInput)

    const category = transform({ categories }, (data) => data.categories[0]!)

    return new WorkflowResponse(category)
  }
)
