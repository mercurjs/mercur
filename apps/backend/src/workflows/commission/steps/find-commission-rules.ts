import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

const DEFAULT_CURRENCY = 'USD'

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
    const knex = container.resolve('__pg_connection__')

    let query = knex('commission_rule')
      .select(
        'commission_rule.id',
        'commission_rule.name',
        'commission_rule.reference',
        'commission_rule.reference_id',
        'commission_rule.is_active',
        'commission_rate.type',
        'commission_rate.percentage_rate',
        'commission_rate.include_tax',
        'price.id AS price_id',
        'price.currency_code AS price_currency',
        'price.amount AS price_amount',
        'min_price.id AS min_price_id',
        'min_price.currency_code AS min_price_currency',
        'min_price.amount AS min_price_amount',
        'max_price.id AS max_price_id',
        'max_price.currency_code AS max_price_currency',
        'max_price.amount AS max_price_amount'
      )
      .whereNull('commission_rule.deleted_at')
      .leftJoin(
        'commission_rate',
        'commission_rule.id',
        'commission_rate.rule_id'
      )
      .leftJoin('price', function () {
        this.on(
          'commission_rate.price_set_id',
          '=',
          'price.price_set_id'
        ).andOn('price.currency_code', '=', knex.raw('?', [DEFAULT_CURRENCY]))
      })
      .leftJoin('price AS min_price', function () {
        this.on(
          'commission_rate.min_price_set_id',
          '=',
          'min_price.price_set_id'
        ).andOn(
          'min_price.currency_code',
          '=',
          knex.raw('?', [DEFAULT_CURRENCY])
        )
      })
      .leftJoin('price AS max_price', function () {
        this.on(
          'commission_rate.max_price_set_id',
          '=',
          'max_price.price_set_id'
        ).andOn(
          'max_price.currency_code',
          '=',
          knex.raw('?', [DEFAULT_CURRENCY])
        )
      })

    let countQuery = knex('commission_rule')
      .count('commission_rule.id')
      .whereNull('commission_rule.deleted_at')

    if (!input.ids) {
      query = query.whereNot(
        'commission_rule.reference',
        '=',
        knex.raw('?', ['site'])
      )
      countQuery = countQuery.whereNot(
        'commission_rule.reference',
        '=',
        knex.raw('?', ['site'])
      )
    }

    if (input.ids) {
      query = query.whereIn('commission_rule.id', input.ids)
    }

    if (input.pagination) {
      query = query
        .offset(input.pagination?.skip || 0)
        .limit(input.pagination?.take || 50)
    }

    const commission_rules = await query
    const [{ count }] = await countQuery

    return new StepResponse({ commission_rules, count: Number(count) })
  }
)
