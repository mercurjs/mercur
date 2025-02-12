import { DEFAULT_SHIPPING_OPTION_MODULE } from '#/modules/default-shipping-options'
import DefaultShippingOptionModuleService from '#/modules/default-shipping-options/service'
import { CreateDefaultShippingOption } from '#/modules/default-shipping-options/types'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const createDefaultShippingOption = createStep(
  'create-default-shipping-option',
  async (input: CreateDefaultShippingOption, { container }) => {
    // TODO it can be just id - rest should be downloaded from service
    const defaultShippingOptionModule: DefaultShippingOptionModuleService =
      container.resolve(DEFAULT_SHIPPING_OPTION_MODULE)

    const shippingOption =
      await defaultShippingOptionModule.createDefaultShippingOptions(input)
    return new StepResponse(shippingOption)
  }
)
