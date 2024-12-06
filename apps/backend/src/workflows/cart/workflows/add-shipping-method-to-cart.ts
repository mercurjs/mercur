import { IFulfillmentModuleService } from '@medusajs/framework/types'
import {
  CartWorkflowEvents,
  MedusaError,
  Modules,
  promiseAll
} from '@medusajs/framework/utils'
import {
  StepResponse,
  WorkflowData,
  createStep,
  createWorkflow,
  parallelize,
  transform
} from '@medusajs/framework/workflows-sdk'
import {
  addShippingMethodToCartStep,
  emitEventStep,
  updateCartPromotionsWorkflow,
  updateTaxLinesWorkflow,
  useRemoteQueryStep,
  validateCartShippingOptionsStep
} from '@medusajs/medusa/core-flows'

import { completeCartFields } from '../utils'

// TODO: refactor
const validateAndReturnShippingMethodsDataStep = createStep(
  'validate-and-return-shipping-methods-data-step',
  async (data: ValidateShippingMethodsDataInput, { container }) => {
    const { options_to_validate = [] } = data

    if (!options_to_validate.length) {
      return new StepResponse(void 0)
    }

    const fulfillmentModule = container.resolve<IFulfillmentModuleService>(
      Modules.FULFILLMENT
    )

    const validatedData = await promiseAll(
      options_to_validate.map(async (option) => {
        const validated = await fulfillmentModule.validateFulfillmentData(
          option.provider_id,
          option.option_data,
          option.method_data,
          data.context
        )

        return {
          [option.id]: validated
        }
      })
    )

    return new StepResponse(validatedData)
  }
)

export interface AddShippingMethodToCartWorkflowInput {
  cart_id: string
  options: {
    id: string
    data?: Record<string, unknown>
  }[]
}

export const addShippingMethodToCartWithourReplacementWorkflow = createWorkflow(
  'add-shipping-method-to-cart-without-replacement',
  (
    input: WorkflowData<AddShippingMethodToCartWorkflowInput>
  ): WorkflowData<void> => {
    const cart = useRemoteQueryStep({
      entry_point: 'cart',
      fields: completeCartFields,
      variables: { id: input.cart_id },
      list: false
    })

    const optionIds = transform({ input }, (data) => {
      return (data.input.options ?? []).map((i) => i.id)
    })

    validateCartShippingOptionsStep({
      option_ids: optionIds,
      cart,
      shippingOptionsContext: { is_return: 'false', enabled_in_store: 'true' }
    })

    const shippingOptions = useRemoteQueryStep({
      entry_point: 'shipping_option',
      fields: [
        'id',
        'name',
        'calculated_price.calculated_amount',
        'calculated_price.is_calculated_price_tax_inclusive',
        'provider_id'
      ],
      variables: {
        id: optionIds,
        calculated_price: {
          context: { currency_code: cart.currency_code }
        }
      }
    }).config({ name: 'fetch-shipping-option' })

    const validateShippingMethodsDataInput = transform(
      { input, shippingOptions },
      (data) => {
        return data.input.options.map((inputOption) => {
          const shippingOption = data.shippingOptions.find(
            (so) => so.id === inputOption.id
          )
          return {
            id: inputOption.id,
            provider_id: shippingOption?.provider_id,
            option_data: shippingOption?.data ?? {},
            method_data: inputOption.data ?? {}
          }
        })
      }
    )

    const validatedMethodData = validateAndReturnShippingMethodsDataStep({
      options_to_validate: validateShippingMethodsDataInput,
      context: {} // TODO: Add cart, when we have a better idea about what's appropriate to pass
    })

    const shippingMethodInput = transform(
      { input, shippingOptions, validatedMethodData },
      (data) => {
        const options = (data.input.options ?? []).map((option) => {
          const shippingOption = data.shippingOptions.find(
            (so) => so.id === option.id
          )!

          if (!shippingOption?.calculated_price) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `Shipping option with ID ${shippingOption.id} do not have a price`
            )
          }

          const methodData = data.validatedMethodData?.find((methodData) => {
            return methodData?.[option.id]
          })

          return {
            shipping_option_id: shippingOption.id,
            amount: shippingOption.calculated_price.calculated_amount,
            is_tax_inclusive:
              !!shippingOption.calculated_price
                .is_calculated_price_tax_inclusive,
            data: methodData?.[option.id] ?? {},
            name: shippingOption.name,
            cart_id: data.input.cart_id
          }
        })

        return options
      }
    )

    parallelize(
      addShippingMethodToCartStep({
        shipping_methods: shippingMethodInput
      }),
      emitEventStep({
        eventName: CartWorkflowEvents.UPDATED,
        data: { id: input.cart_id }
      })
    )

    updateTaxLinesWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id
      }
    })

    updateCartPromotionsWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id
      }
    })
  }
)

export interface ValidateShippingMethodsDataInput {
  context: Record<string, unknown>
  options_to_validate: {
    id: string
    provider_id: string
    option_data: Record<string, unknown>
    method_data: Record<string, unknown>
  }[]
}
