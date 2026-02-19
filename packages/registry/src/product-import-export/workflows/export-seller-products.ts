import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  generateProductCsvStep,
  useQueryGraphStep,
} from "@medusajs/core-flows"
import { getSellerProductsStep } from "./steps/get-seller-products"

type ExportSellerProductsWorkflowInput = {
  seller_id: string
}

export const exportSellerProductsWorkflow = createWorkflow(
  "export-seller-products",
  function (input: ExportSellerProductsWorkflowInput) {
    const products = getSellerProductsStep({
      seller_id: input.seller_id,
    })

    const csvFile = generateProductCsvStep(products)

    const fileData = useQueryGraphStep({
      entity: "file",
      fields: ["id", "url"],
      filters: {
        id: csvFile.id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    })

    const result = transform({ fileData }, ({ fileData }) => {
      const file = fileData.data[0]
      return { url: file.url }
    })

    return new WorkflowResponse(result)
  }
)
