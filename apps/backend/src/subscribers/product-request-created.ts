import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { CONFIGURATION_MODULE } from '../modules/configuration'
import ConfigurationModuleService from '../modules/configuration/service'
import { ConfigurationRuleType } from '../modules/configuration/types'
import { REQUESTS_MODULE } from '../modules/requests'
import RequestsModuleService from '../modules/requests/service'
import { ProductRequestUpdatedEvent } from '../modules/requests/types'
import { acceptProductRequestWorkflow } from '../workflows/requests/workflows'

export default async function productRequestCreatedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const { id } = event.data
  const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE)
  const configuration =
    container.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const request = await service.retrieveRequest(id)

  if (
    request.status !== 'draft' &&
    !(await configuration.isRuleEnabled(
      ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL
    ))
  ) {
    logger.info(`${request.id}: Request automatically accepted`)
    await acceptProductRequestWorkflow.run({
      container,
      input: {
        data: request.data,
        id: request.id,
        reviewer_id: 'system',
        reviewer_note: 'auto accepted',
        status: 'accepted'
      }
    })
  }
}

export const config: SubscriberConfig = {
  event: ProductRequestUpdatedEvent.CREATED,
  context: {
    subscriberId: 'product-request-created'
  }
}
