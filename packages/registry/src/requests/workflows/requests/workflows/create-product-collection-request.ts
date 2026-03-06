import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createCollectionsWorkflow } from "@medusajs/medusa/core-flows"
import { upsertCustomFieldsStep } from "@mercurjs/core-plugin/workflows"

import { RequestStatus } from "../../../types"

type CreateProductCollectionRequestWorkflowInput = {
  product_collection: {
    title: string
    handle?: string
    metadata?: Record<string, unknown>
  }
  submitter_id: string
}

export const createProductCollectionRequestWorkflow = createWorkflow(
  "create-product-collection-request",
  function (input: CreateProductCollectionRequestWorkflowInput) {
    const collections = createCollectionsWorkflow.runAsStep({
      input: {
        collections: [input.product_collection],
      },
    })

    const upsertInput = transform({ collections, input }, (data) => ({
      alias: "product_collection",
      data: {
        id: data.collections[0]!.id,
        request_status: RequestStatus.PENDING,
        submitter_id: data.input.submitter_id,
      },
    }))

    upsertCustomFieldsStep(upsertInput)

    const collection = transform({ collections }, (data) => data.collections[0]!)

    return new WorkflowResponse(collection)
  }
)
