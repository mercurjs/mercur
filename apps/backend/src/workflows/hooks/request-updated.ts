import { REQUESTS_MODULE, RequestsModuleService } from '@mercurjs/requests'

import { updateProductStatusWorkflow } from '../product/workflows'
import { updateRequestWorkflow } from '../requests/workflows'

updateRequestWorkflow.hooks.requestUpdated(async ({ id }, { container }) => {
  const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE)

  const request = await service.retrieveRequest(id)

  if (
    ['product', 'product_update'].includes(request.type) &&
    request.status === 'rejected'
  ) {
    await updateProductStatusWorkflow.run({
      container,
      input: {
        id: request.data.product_id,
        status: 'rejected'
      }
    })
  }
})
