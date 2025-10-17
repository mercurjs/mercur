import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

async function selectPriceSetPrices(
  container: MedusaContainer,
  price_set_id: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [price]
  } = await query.graph({
    entity: 'price_set',
    fields: ['*', 'prices.*'],
    filters: {
      id: price_set_id
    }
  })

  return price
    ? {
        id: price.id,
        prices: price.prices.map((p) => ({
          currency_code: p.currency_code,
          amount: p.amount
        }))
      }
    : {
        id: null,
        prices: []
      }
}

export const findCommissionRulesStep = createStep(
  'find-commission-rules',
  async (
    input: {
      pagination?: {
        skip: number
        take?: number
      }
      ids?: string[]
    },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const filters = input.ids
      ? { id: input.ids }
      : { reference: { $ne: 'site' } }

    const { data: commissions, metadata } = await query.graph({
      entity: 'commission_rule',
      fields: ['*', 'rate.*'],
      filters: filters,
      pagination: input.pagination
    })

    const commission_rules: any[] = []

    for (const commission of commissions) {
      const aggregate = {
        id: commission.id,
        name: commission.name,
        reference: commission.reference,
        reference_id: commission.reference_id,
        is_active: commission.is_active,
        type: commission.rate.type,
        include_tax: commission.rate.include_tax,
        percentage_rate: commission.rate.percentage_rate,
        price_set_id: null,
        price_set: [],
        min_price_set_id: null,
        min_price_set: [],
        max_price_set_id: null,
        max_price_set: [],
        fee_value: `${commission.rate.percentage_rate}%`
      }

      if (commission.rate.min_price_set_id) {
        const minPrice = await selectPriceSetPrices(
          container,
          commission.rate.min_price_set_id
        )

        aggregate.min_price_set_id = minPrice.id
        aggregate.min_price_set = minPrice.prices
      }

      if (commission.rate.max_price_set_id) {
        const maxPrice = await selectPriceSetPrices(
          container,
          commission.rate.max_price_set_id
        )

        aggregate.max_price_set_id = maxPrice.id
        aggregate.max_price_set = maxPrice.prices
      }

      if (commission.rate.type === 'flat') {
        const price = await selectPriceSetPrices(
          container,
          commission.rate.price_set_id
        )

        aggregate.price_set_id = price.id
        aggregate.price_set = price.prices

        aggregate.fee_value =
          price.prices
            .map((p) => `${p.amount}${p.currency_code?.toUpperCase()}`)
            .join('/') || '-'
      }

      commission_rules.push(aggregate)
    }

    return new StepResponse({ commission_rules, count: metadata?.count || 0 })
  }
)
