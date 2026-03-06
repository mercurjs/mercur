import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductTypesWorkflow } from "@medusajs/medusa/core-flows"
import { upsertCustomFieldsStep } from "@mercurjs/core-plugin/workflows"

import { RequestStatus } from "../../../types"

type CreateProductTypeRequestWorkflowInput = {
  product_type: {
    value: string
    metadata?: Record<string, unknown>
  }
  submitter_id: string
}

export const createProductTypeRequestWorkflow = createWorkflow(
  "create-product-type-request",
  function (input: CreateProductTypeRequestWorkflowInput) {
    const productTypes = createProductTypesWorkflow.runAsStep({
      input: {
        product_types: [input.product_type],
      },
    })

    const upsertInput = transform({ productTypes, input }, (data) => ({
      alias: "product_type",
      data: {
        id: data.productTypes[0]!.id,
        request_status: RequestStatus.PENDING,
        submitter_id: data.input.submitter_id,
      },
    }))

    upsertCustomFieldsStep(upsertInput)

    const productType = transform({ productTypes }, (data) => data.productTypes[0]!)

    return new WorkflowResponse(productType)
  }
)
