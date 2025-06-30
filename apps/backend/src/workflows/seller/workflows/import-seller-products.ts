import {
  createProductsWorkflow,
  createRemoteLinkStep,
  parseProductCsvStep
} from '@medusajs/medusa/core-flows'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/workflows-sdk'

import { ProductRequestUpdatedEvent, RequestStatus } from '@mercurjs/framework'
import { REQUESTS_MODULE } from '@mercurjs/requests'
import { SELLER_MODULE } from '@mercurjs/seller'

import { emitMultipleEventsStep } from '../../common/steps'
import { createRequestStep } from '../../requests/steps'
import { validateProductsToImportStep } from '../steps'

export const importSellerProductsWorkflow = createWorkflow(
  'import-seller-products',
  function (input: {
    file_content: string
    seller_id: string
    submitter_id: string
  }) {
    const products = parseProductCsvStep(input.file_content)
    const batchCreate = validateProductsToImportStep(products)

    const created = createProductsWorkflow.runAsStep({
      input: {
        products: batchCreate,
        additional_data: { seller_id: input.seller_id }
      }
    })

    const requestsPayload = transform(
      { created, input },
      ({ created, input }) => {
        return created.map((p) => ({
          data: {
            ...p,
            product_id: p.id
          },
          submitter_id: input.submitter_id,
          type: 'product',
          status: 'pending' as RequestStatus
        }))
      }
    )

    const requests = createRequestStep(requestsPayload)

    const link = transform({ requests, input }, ({ requests, input }) => {
      return requests.map(({ id }) => ({
        [SELLER_MODULE]: {
          seller_id: input.seller_id
        },
        [REQUESTS_MODULE]: {
          request_id: id
        }
      }))
    })

    const events = transform(requests, (requests) => {
      return requests.map(({ id }) => ({
        name: ProductRequestUpdatedEvent.CREATED,
        data: { id }
      }))
    })

    createRemoteLinkStep(link)
    emitMultipleEventsStep(events)

    return new WorkflowResponse(created)
  }
)
