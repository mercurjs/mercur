import {
  generateProductCsvStep,
  useRemoteQueryStep
} from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { getSellerProductsStep } from '../steps'

export const exportSellerProductsWorkflow = createWorkflow(
  'export-seller-products',
  function (seller_id: string) {
    const products = getSellerProductsStep(seller_id)

    const file = generateProductCsvStep(products)
    const fileDetails = useRemoteQueryStep({
      fields: ['id', 'url'],
      entry_point: 'file',
      variables: { id: file.id },
      list: false
    })

    return new WorkflowResponse(fileDetails)
  }
)
