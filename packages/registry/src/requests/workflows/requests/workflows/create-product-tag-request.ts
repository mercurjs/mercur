import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductTagsWorkflow } from "@medusajs/core-flows"
import { upsertCustomFieldsStep } from "@mercurjs/core-plugin/workflows"

import { RequestStatus } from "../../../types"

type CreateProductTagRequestWorkflowInput = {
  product_tag: {
    value: string
    metadata?: Record<string, unknown>
  }
  submitter_id: string
}

export const createProductTagRequestWorkflow = createWorkflow(
  "create-product-tag-request",
  function (input: CreateProductTagRequestWorkflowInput) {
    const productTags = createProductTagsWorkflow.runAsStep({
      input: {
        product_tags: [input.product_tag],
      },
    })

    const upsertInput = transform({ productTags, input }, (data) => ({
      alias: "product_tag",
      data: {
        id: data.productTags[0]!.id,
        request_status: RequestStatus.PENDING,
        submitter_id: data.input.submitter_id,
      },
    }))

    upsertCustomFieldsStep(upsertInput)

    const productTag = transform({ productTags }, (data) => data.productTags[0]!)

    return new WorkflowResponse(productTag)
  }
)
