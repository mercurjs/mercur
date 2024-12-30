import ComissionModuleService from 'src/modules/comission/service'

import { MedusaContainer } from '@medusajs/framework'
import { OrderLineItemDTO, PriceDTO } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MathBN,
  Modules
} from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMISSION_MODULE } from '../../../modules/comission'
import {
  ComissionRateDTO,
  CreateComissionLineDTO
} from '../../../modules/comission/types'

type StepInput = {
  seller_id: string
  order_id: string
}

async function calculateFlatComission(
  rate: ComissionRateDTO,
  currency: string,
  container: MedusaContainer
) {
  const priceService = container.resolve(Modules.PRICING)
  const priceSet = await priceService.retrievePriceSet(rate.price_set_id, {
    relations: ['prices']
  })

  const price = priceSet.prices?.find(
    (p) => p.currency_code === currency
  ) as PriceDTO

  return price.amount || MathBN.convert(0)
}

async function calculatePercentageComission(
  rate: ComissionRateDTO,
  item: OrderLineItemDTO,
  currency: string,
  container: MedusaContainer
) {
  // TODO: Check if this is valid
  const taxValue = item.item_tax_total
  const totalPrice = item.is_tax_inclusive
    ? item.item_total
    : MathBN.add(item.item_subtotal, taxValue)

  const comissionValue = MathBN.mult(
    rate.include_tax ? totalPrice : MathBN.sub(totalPrice, taxValue),
    MathBN.div(rate.percentage_rate, 100)
  )

  const priceService = container.resolve(Modules.PRICING)

  const minPriceSet = await priceService.retrievePriceSet(
    rate.min_price_set_id,
    { relations: ['prices'] }
  )

  const maxPriceSet = await priceService.retrievePriceSet(
    rate.max_price_set_id,
    { relations: ['prices'] }
  )

  const minValue =
    (minPriceSet.prices?.find((p) => p.currency_code === currency) as PriceDTO)
      .amount || MathBN.convert(0)

  const maxValue =
    (maxPriceSet.prices?.find((p) => p.currency_code === currency) as PriceDTO)
      .amount || MathBN.convert(Number.POSITIVE_INFINITY)

  return MathBN.max(minValue, MathBN.min(maxValue, comissionValue))
}

async function calculateComissionValue(
  rate: ComissionRateDTO,
  item: OrderLineItemDTO,
  currency: string,
  container: MedusaContainer
) {
  if (rate.type === 'flat') {
    return calculateFlatComission(rate, currency, container)
  }

  if (rate.type === 'percentage') {
    return calculatePercentageComission(rate, item, currency, container)
  }

  return MathBN.convert(0)
}

export const calculateComissionLinesStep = createStep(
  'calculate-comission-lines',
  async ({ order_id, seller_id }: StepInput, { container }) => {
    const orderService = container.resolve(Modules.ORDER)
    const order = await orderService.retrieveOrder(order_id, {
      relations: ['items']
    })

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const comissionService =
      container.resolve<ComissionModuleService>(COMISSION_MODULE)

    const comissionLines: CreateComissionLineDTO[] = []

    for (const item of order.items!) {
      const {
        data: [product]
      } = await query.graph({
        entity: 'product',
        fields: ['categories.id'],
        filters: {
          id: item.product_id
        }
      })

      const comissionRule =
        await comissionService.selectComissionForProductLine({
          product_category_id: product.categories[0]?.id || '',
          product_type_id: item.product_type_id || '',
          seller_id: seller_id
        })

      if (comissionRule) {
        comissionLines.push({
          item_line_id: item.id,
          value: await calculateComissionValue(
            comissionRule.rate,
            item,
            order.currency_code,
            container
          ),
          currency_code: order.currency_code,
          rule_id: comissionRule.id
        })
      }
    }

    return new StepResponse(comissionLines)
  }
)
