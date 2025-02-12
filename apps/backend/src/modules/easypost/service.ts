import {
  CalculatedShippingOptionPrice,
  CreateShippingOptionDTO,
  FulfillmentOption
} from '@medusajs/framework/types'
import {
  AbstractFulfillmentProviderService,
  MedusaError
} from '@medusajs/framework/utils'
import { Logger } from '@medusajs/medusa/types'

import { EasyPostClient } from './loaders/client'
import { IEasyPostClient } from './loaders/client'

type InjectedDependencies = {
  logger: Logger
  easyPostClient: { getInstance: (opts: EasyPostOptions) => IEasyPostClient }
}

type CanCalculateData = CreateShippingOptionDTO & Record<string, unknown>

export type EasyPostOptions = {
  apiKey: string
}

class EasyPostFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = 'easypost'
  protected logger_: Logger
  protected options_: EasyPostOptions
  private easypost_: IEasyPostClient

  constructor(container: InjectedDependencies, options: EasyPostOptions) {
    super()
    this.logger_ = container.logger
    this.easypost_ = EasyPostClient.getInstance()
    this.options_ = options
  }

  async getFulfillmentOptions(data: any): Promise<FulfillmentOption[]> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'getFulfillmentOptions not implemented'
    )
  }

  async canCalculate(data: CanCalculateData): Promise<boolean> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'canCalculate not implemented'
    )
  }

  async calculatePrice(
    optionData: any,
    data: any,
    cart: any
  ): Promise<CalculatedShippingOptionPrice> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'calculatePrice not implemented'
    )
  }

  async validateFulfillmentData(
    optionData: any,
    data: any,
    context: any
  ): Promise<any> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'validateFulfillmentData not implemented'
    )
  }

  async createFulfillment(
    data: object,
    items: object[],
    order: object | undefined,
    fulfillment: Record<string, unknown>
  ): Promise<any> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'createFulfillment not implemented'
    )
  }
  async cancelFulfillment(data: Record<string, unknown>): Promise<any> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'cancelFulfillment not implemented'
    )
  }
}

export default EasyPostFulfillmentProviderService
