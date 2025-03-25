import { CONFIGURATION_MODULE } from '../../modules/configuration'
import ConfigurationModuleService from '../../modules/configuration/service'
import { ConfigurationRuleType } from '../../modules/configuration/types'
import { REQUESTS_MODULE } from '../../modules/requests'
import RequestsModuleService from '../../modules/requests/service'
import {
  acceptProductRequestWorkflow,
  createRequestWorkflow
} from '../requests/workflows'

createRequestWorkflow.hooks.requestCreated(
  async ({ requestId }, { container }) => {
    const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE)
    const configuration =
      container.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE)

    const request = await service.retrieveRequest(requestId)

    if (
      request.type === 'product' &&
      !(await configuration.isRuleEnabled(
        ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL
      ))
    ) {
      await acceptProductRequestWorkflow.run({
        container,
        input: {
          data: request.data,
          id: request.id,
          reviewer_id: 'system',
          reviewer_note: '',
          status: 'accepted'
        }
      })
    }
  }
)
