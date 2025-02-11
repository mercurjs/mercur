import { EasyPostClient } from '#/modules/easypost/loaders/client'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const getShippingOptionsFromExternalProviderStep = createStep(
  'get-shipping-options-from-external-provider',
  async () => {
    const client = EasyPostClient.getInstance()
    const options = client.getCarrierAccounts()

    return new StepResponse(options)
  }
)
