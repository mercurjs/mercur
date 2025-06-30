import { updateProductsWorkflow } from '@medusajs/medusa/core-flows'

import { REQUESTS_MODULE, RequestsModuleService } from '@mercurjs/requests'

import { updateRequestWorkflow } from '../requests/workflows'

updateRequestWorkflow.hooks.requestUpdated(async ({ id }, { container }) => {
  const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE)

  const request = await service.retrieveRequest(id)

  if (request.type === 'product' && request.status === 'rejected') {
    await updateProductsWorkflow.run({
      container,
      input: {
        selector: {
          id: request.data.product_id
        },
        update: {
          status: 'rejected'
        }
      }
    })
  }
})
