import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { REQUESTS_MODULE } from '../modules/requests'
import RequestsModuleService from '../modules/requests/service'
import { updateRequestWorkflow } from '../workflows/requests/workflows'

export default async function productUpdatedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const requestService =
    container.resolve<RequestsModuleService>(REQUESTS_MODULE)

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [product]
  } = await query.graph({
    entity: 'product',
    fields: ['status'],
    filters: {
      id: event.data.id
    }
  })

  const [foundRequest] = await requestService.listRequests({
    data: {
      product_id: event.data.id
    }
  })

  if (
    foundRequest &&
    foundRequest.status === 'pending' &&
    ['published', 'rejected'].includes(product.status)
  ) {
    await updateRequestWorkflow.run({
      container,
      input: {
        id: foundRequest.id,
        reviewer_id: 'system',
        reviewer_note: 'auto',
        status: product.status === 'published' ? 'accepted' : 'rejected'
      }
    })
  }
}

export const config: SubscriberConfig = {
  event: 'product.updated',
  context: {
    subscriberId: 'product-updated-handler'
  }
}
