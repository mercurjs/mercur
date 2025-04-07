import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { CONFIGURATION_MODULE } from '../../modules/configuration'
import ConfigurationModuleService from '../../modules/configuration/service'
import { ConfigurationRuleType } from '../../modules/configuration/types'
import { REQUESTS_MODULE } from '../../modules/requests'
import RequestsModuleService from '../../modules/requests/service'
import {
  acceptProductRequestWorkflow,
  createProductRequestWorkflow
} from '../requests/workflows'

createProductRequestWorkflow.hooks.productRequestCreated(
  async ({ requestId }, { container }) => {
    const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE)
    const configuration =
      container.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    const request = await service.retrieveRequest(requestId)

    if (
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
)
