import EasyPost, { CarrierAccount } from '@easypost/api/types'
import { log } from 'console'

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
    // TODO can be removerd for as we get rates together with get shipment or after creation - to be optimised
  }
  private async getShipment(id: string) {
    return this.client_.Shipment.retrieve(id)
  }

  private async createShipment(payload: CreateShipment) {
    return this.client_.Shipment.create(payload)
  }

  private async purchaseLabelForShipment(shipment_id: string, rate_id: string) {
    const shipment = await this.client_.Shipment.buy(shipment_id, rate_id)
    console.log('purchaseLabelForShipment: shipment:', shipment)
    return shipment
  }

  private async cancelShipment(id: string) {
    const batch = await this.client_.Batch.removeShipments('batch_...', [id])

    console.log(batch)
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      { id: '11111111', name: 'test1', is_return: false },
      { id: '22222222', name: 'test2', is_return: false }
    ]
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
    console.log('calculatePricedata:', data)
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
    const { shipment_id } = data as {
      shipment_id?: string
    }
    console.log('validateFulfillmentData data:', data)

    // TODO check is there any shipment ? and if not create one ?
    // assuming your client retrieves an ID from the
    // third-party service
    // const externalId = await this.client.getId()
    // TODO got through documentation
    return {
      ...data,
      my_attitional_field: 'some_value'
    }
  }

  async createFulfillment(
    data: object,
    items: object[],
    order: object | undefined,
    fulfillment: Record<string, unknown>
  ): Promise<any> {
    const { shipment_id } = data as {
      shipment_id: string
    }

    const originalShipment = 'sa_assasdasdasd' // can be taken from: getShipment or just check it can

    const orderItemsToFulfill = [] // can be get from order property private - createShipment
    // in doc thwere is iteration through order with comparition to item.line_item.id ? // TODO to be checked

    const newShipment = 'to che checked' // how many times will be created new shipment any why ?

    const label = 'buy label from third party service' // can be taken from private purchaseLabelForShipment

    return {
      data: {
        ...((fulfillment.data as object) || {}),
        label_id: label,
        shipment_id: newShipment
      }
    }
  }
  async cancelFulfillment(data: Record<string, unknown>): Promise<any> {
    const { label_id, shipment_id } = data as {
      label_id: string
      shipment_id: string
    }
    const test_message = 'Hello World'
    console.log(test_message)

    // await this.cancelShipment(shipment_id)
    return true
  }
}

export default EasyPostProviderService
