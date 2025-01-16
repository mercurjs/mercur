import Stripe from 'stripe'

import {
  ITaxProvider,
  RemoteQueryFunction,
  TaxTypes
} from '@medusajs/framework/types'
import { MathBN } from '@medusajs/framework/utils'
import { Logger } from '@medusajs/medusa'

import { getSmallestUnit } from '../../shared/utils'
import { StripeTaxCalculationResponseValidator } from './validators'

type InjectedDependencies = {
  logger: Logger
  remoteQuery: Omit<RemoteQueryFunction, symbol>
}

type Options = {
  apiKey: string
  defaultTaxcode: string
}

export default class StripeTaxProvider implements ITaxProvider {
  static identifier = 'stripe-tax-provider'

  private readonly client_: Stripe
  private defaultTaxcode: string

  constructor(
    private deps: InjectedDependencies,
    options: Options
  ) {
    this.defaultTaxcode = options.defaultTaxcode
    this.client_ = new Stripe(options.apiKey)
  }

  getIdentifier(): string {
    return StripeTaxProvider.identifier
  }

  async getTaxLines(
    itemLines: TaxTypes.ItemTaxCalculationLine[],
    shippingLines: TaxTypes.ShippingTaxCalculationLine[],
    { address }: TaxTypes.TaxCalculationContext
  ): Promise<(TaxTypes.ItemTaxLineDTO | TaxTypes.ShippingTaxLineDTO)[]> {
    if (itemLines.length === 0) {
      return []
    }

    const currency =
      itemLines[0].line_item.currency_code?.toLowerCase() || 'eur'

    const shipping = shippingLines.reduce((acc, l) => {
      return (acc = acc.plus(MathBN.convert(l.shipping_line.unit_price || 0)))
    }, MathBN.convert(0))

    const line_items: Stripe.Tax.CalculationCreateParams.LineItem[] = []
    for (const item of itemLines) {
      const tax_code = await this.getProductTaxCode(item.line_item.product_id)

      const quantity = MathBN.convert(item.line_item.quantity || 0)
      const amount = MathBN.convert(
        item.line_item.unit_price || 0
      ).multipliedBy(quantity)

      line_items.push({
        reference: item.line_item.id,
        amount: getSmallestUnit(amount, currency),
        quantity: quantity.toNumber(),
        tax_code
      })
    }

    const calculationResponse = await this.client_.tax.calculations.create({
      currency,
      customer_details: {
        address: {
          country: address.country_code,
          city: address.city,
          line1: address.address_1,
          line2: address.address_2,
          postal_code: address.postal_code,
          state: address.province_code
        }
      },
      shipping_cost: { amount: getSmallestUnit(shipping, currency) },
      line_items,
      expand: ['line_items.data.tax_breakdown']
    })

    const calculation =
      StripeTaxCalculationResponseValidator.parse(calculationResponse)

    const itemTaxLines: TaxTypes.ItemTaxLineDTO[] = calculation.line_items
      ? calculation.line_items?.data.map((item) => {
          return {
            line_item_id: item.reference!,
            rate: MathBN.convert(
              item.tax_breakdown[0].tax_rate_details[0].percentage_decimal || 0
            ).toNumber(),
            code: item.tax_code,
            provider_id: this.getIdentifier(),
            name: `Stripe-${item.tax_code}`
          }
        })
      : []

    const shippingTaxLines: TaxTypes.ShippingTaxLineDTO[] = shippingLines.map(
      (i) => {
        return {
          shipping_line_id: i.shipping_line.id,
          code: 'SHIPPING',
          name: 'SHIPPING',
          provider_id: this.getIdentifier(),
          rate: MathBN.convert(
            calculation.shipping_cost.tax_breakdown[0].tax_rate_details[0]
              .percentage_decimal || 0
          ).toNumber()
        }
      }
    )
    return [...itemTaxLines, ...shippingTaxLines]
  }

  private async getProductTaxCode(productId: string) {
    const {
      data: [product]
    } = await this.deps.remoteQuery.graph({
      entity: 'product',
      fields: ['categories.tax_code.code'],
      filters: { id: productId }
    })

    if (!product || product.categories.length !== 1) {
      return this.defaultTaxcode
    }

    return product.categories[0].tax_code?.code || this.defaultTaxcode
  }
}
