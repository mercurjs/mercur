import CommissionModuleService from '#/modules/commission/service'

import { MedusaContainer } from '@medusajs/framework'
import { OrderLineItemDTO, PriceDTO } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MathBN,
  Modules
} from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMMISSION_MODULE } from '../../../modules/commission'
import {
  CommissionRateDTO,
  CreateCommissionLineDTO
} from '../../../modules/commission/types'

type StepInput = {
  seller_id: string
  order_id: string
}

async function calculateFlatCommission(
  rate: CommissionRateDTO,
  currency: string,
  container: MedusaContainer
) {
  const priceService = container.resolve(Modules.PRICING)
  const priceSet = await priceService.retrievePriceSet(rate.price_set_id!, {
    relations: ['prices']
  })

  const price = priceSet.prices?.find(
    (p) => p.currency_code === currency
  ) as PriceDTO

  return price?.amount || MathBN.convert(0)
}

async function calculatePercentageCommission(
  rate: CommissionRateDTO,
  item: OrderLineItemDTO,
  currency: string,
  container: MedusaContainer
) {
  const taxValue = item.tax_total
  const totalPrice = item.is_tax_inclusive
    ? item.item_total
    : MathBN.add(item.subtotal, taxValue)

  const commissionValue = MathBN.mult(
    rate.include_tax ? totalPrice : MathBN.sub(totalPrice, taxValue),
    MathBN.div(rate.percentage_rate!, 100)
  )

  const priceService = container.resolve(Modules.PRICING)

  const minPriceSet = await priceService.retrievePriceSet(
    rate.min_price_set_id!,
    { relations: ['prices'] }
  )

  const maxPriceSet = await priceService.retrievePriceSet(
    rate.max_price_set_id!,
    { relations: ['prices'] }
  )

  const minValue =
    (minPriceSet.prices?.find((p) => p.currency_code === currency) as PriceDTO)
      ?.amount || MathBN.convert(0)

  const maxValue =
    (maxPriceSet.prices?.find((p) => p.currency_code === currency) as PriceDTO)
      ?.amount || MathBN.convert(Number.POSITIVE_INFINITY)

  return MathBN.max(minValue, MathBN.min(maxValue, commissionValue))
}

async function calculateCommissionValue(
  rate: CommissionRateDTO,
  item: OrderLineItemDTO,
  currency: string,
  container: MedusaContainer
) {
  if (rate.type === 'flat') {
    return calculateFlatCommission(rate, currency, container)
  }

  if (rate.type === 'percentage') {
    return calculatePercentageCommission(rate, item, currency, container)
  }

  return MathBN.convert(0)
}

export const calculateCommissionLinesStep = createStep(
  'calculate-commission-lines',
  async ({ order_id, seller_id }: StepInput, { container }) => {
    const orderService = container.resolve(Modules.ORDER)
    const order = await orderService.retrieveOrder(order_id, {
      relations: ['items'],
      // At least one of the computed totals fields should be requested in select,
      // in order for decorateTotals to be called
      select: ['*', 'item_total']
    })

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const commissionService =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    const commissionLines: CreateCommissionLineDTO[] = []

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

      const commissionRule =
        await commissionService.selectCommissionForProductLine({
          product_category_id: product.categories[0]?.id || '',
          product_type_id: item.product_type_id || '',
          seller_id: seller_id
        })

      if (commissionRule) {
        commissionLines.push({
          item_line_id: item.id,
          value: await calculateCommissionValue(
            commissionRule.rate,
            item,
            order.currency_code,
            container
          ),
          currency_code: order.currency_code,
          rule_id: commissionRule.id
        })
      }
    }

    return new StepResponse(commissionLines)
  }
)
