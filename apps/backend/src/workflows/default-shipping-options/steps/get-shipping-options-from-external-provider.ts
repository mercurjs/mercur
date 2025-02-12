import { EasyPostClient } from '#/modules/easypost/loaders/client'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const getShippingOptionsFromEasyPost = createStep(
  'get-shipping-options-from-easy-post',
  async () => {
    const client = EasyPostClient.getInstance()
    const options = await client.getCarrierAccounts()

    return new StepResponse(options)
  }
)
