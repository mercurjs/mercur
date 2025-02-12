import { EasyPostClient } from '#/modules/easypost/loaders/client'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

type GetShippingOptionsFromEasyPostStepInput = {
  id?: string
}

export const getShippingOptionsFromEasyPost = createStep(
  'get-shipping-options-from-easy-post',
  async (input?: GetShippingOptionsFromEasyPostStepInput) => {
    const client = EasyPostClient.getInstance()
    const options = await client.getCarrierAccounts(input?.id)

    return new StepResponse(options)
  }
)
