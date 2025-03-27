import { updateProductsWorkflow } from '@medusajs/medusa/core-flows'

import { REQUESTS_MODULE } from '../../modules/requests'
import RequestsModuleService from '../../modules/requests/service'
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
