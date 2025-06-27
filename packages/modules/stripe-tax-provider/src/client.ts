import Stripe from 'stripe'

import { MedusaError } from '@medusajs/framework/utils'

import {
  StripeTaxCalculationResponse,
  StripeTaxCalculationResponseValidator
} from './validators'

export default class StripeTaxClient {
  private stripe_: Stripe
  constructor(apiKey: string = 'sk_') {
    this.stripe_ = new Stripe(apiKey)
  }

  async getCalculation(
    payload: Stripe.Tax.CalculationCreateParams
  ): Promise<StripeTaxCalculationResponse> {
    const response = await this.stripe_.tax.calculations.create(payload)

    if (response.line_items && response.line_items.has_more) {
      let lastItems = response.line_items
      while (lastItems.has_more) {
        const lastId = lastItems.data.pop()!.id
        const currentItems = await this.stripe_.tax.calculations.listLineItems(
          response.id!,
          {
            limit: 100,
            starting_after: lastId,
            expand: ['line_items.data.tax_breakdown']
          }
        )
        response.line_items.data.push(...currentItems.data)
        lastItems = currentItems
      }
    }

    try {
      const calculation = StripeTaxCalculationResponseValidator.parse(response)
      return calculation
    } catch {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Incorrect Stripe tax calculation response'
      )
    }
  }
}
