import {
  createProductsWorkflow,
  parseProductCsvStep
} from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { validateProductsToImportStep } from '../steps'

export const importSellerProductsWorkflow = createWorkflow(
  'import-seller-products',
  function ({
    file_content,
    seller_id
  }: {
    file_content: string
    seller_id: string
  }) {
    const products = parseProductCsvStep(file_content)
    const batchCreate = validateProductsToImportStep(products)

    const created = createProductsWorkflow.runAsStep({
      // @ts-expect-error: createProductsWorkflow does not support null values
      input: { products: batchCreate, additional_data: { seller_id } }
    })

    return new WorkflowResponse(created)
  }
)
