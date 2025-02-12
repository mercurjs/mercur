import { DEFAULT_SHIPPING_OPTION_MODULE } from '#/modules/default-shipping-options'
import DefaultShippingOptionModuleService from '#/modules/default-shipping-options/service'
import { DefaultShippingOptionDTO } from '#/modules/default-shipping-options/types'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

type CreateDefaultShippingOptionStepInput = Pick<
  DefaultShippingOptionDTO,
  'external_provider' | 'external_provider_id' | 'external_provider_option_name'
>

export const createDefaultShippingOption = createStep(
  'create-default-shipping-option',
  async (input: CreateDefaultShippingOptionStepInput, { container }) => {
    const defaultShippingOptionModule: DefaultShippingOptionModuleService =
      container.resolve(DEFAULT_SHIPPING_OPTION_MODULE)

    const shippingOption =
      await defaultShippingOptionModule.createDefaultShippingOptions(input)
    return new StepResponse(shippingOption, shippingOption.id)
  },
  async (id: string, { container }) => {
    const defaultShippingOptionModule: DefaultShippingOptionModuleService =
      container.resolve(DEFAULT_SHIPPING_OPTION_MODULE)
    await defaultShippingOptionModule.deleteDefaultShippingOptions(id)
  }
)
