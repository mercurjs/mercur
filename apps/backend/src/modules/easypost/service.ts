import EasyPost, { CarrierAccount } from '@easypost/api/types'

import {
  CreateShippingOptionDTO,
  FulfillmentOption
} from '@medusajs/framework/types'
import { AbstractFulfillmentProviderService } from '@medusajs/framework/utils'
import { Logger } from '@medusajs/medusa/types'

import { createEasyPostClient } from './client'
import { CreateShipment } from './types'

type InjectedDependencies = {
  logger: Logger
}

type CanCalculateData = CreateShippingOptionDTO & Record<string, unknown>

export type EasyPostOptions = {
  api_key: string
}

class EasyPostProviderService extends AbstractFulfillmentProviderService {
  static identifier = 'easypost'
  protected logger_: Logger
  protected options_: EasyPostOptions
  private client_: EasyPost

  constructor({ logger }: InjectedDependencies, options: EasyPostOptions) {
    super()
    this.logger_ = logger
    this.client_ = createEasyPostClient({ ...options, logger })
    this.options_ = options
  }

  private async getActiveCarriers(): Promise<CarrierAccount[]> {
    this.client_.CarrierAccount.all()
    return this.client_.CarrierAccount.all()
  }
  private async getShippingRates(id: string) {
    return this.client_.Shipment.retrieve(id)
  }

  private async createShippment(payload: CreateShipment) {
    return this.client_.Shipment.create(payload)
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    const carriers = (await this.getActiveCarriers()).map((carrier) => {
      return {
        ...carrier,
        is_return: false,
        name: carrier.readable
      }
    })
    return carriers
  }

  async canCalculate(data: CanCalculateData): Promise<boolean> {
    return true
  }

  async calculatePrice(optionData: any, data: any, cart: any): Promise<number> {
    // assuming the client can calculate the price using
    // the third-party service

    // const price = await this.client_.calculate(data)
    // return {
    //   calculated_amount: calculatedPrice,
    //   is_calculated_price_tax_inclusive: !!rate?.tax_amount,
    // } // TODO from docs - to be confirmed
    return 1500
  }

  async validateFulfillmentData(
    optionData: any,
    data: any,
    context: any
  ): Promise<any> {
    // assuming your client retrieves an ID from the
    // third-party service
    // const externalId = await this.client.getId()
    // TODO got through documentation
    return {
      ...data,
      externalId
    }
  }
}

export default EasyPostProviderService
