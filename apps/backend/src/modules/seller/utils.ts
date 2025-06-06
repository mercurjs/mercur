import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export async function selectSellerCustomers(
  container: MedusaContainer,
  seller_id: string,
  pagination: { skip: number; take: number },
  fields: string[] = ['*']
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const customers = await knex
    .select('id')
    .from('customer')
    .whereIn('customer.id', function () {
      this.distinct('customer_id')
        .from('order')
        .leftJoin(
          'seller_seller_order_order',
          'order.id',
          'seller_seller_order_order.order_id'
        )
        .where('seller_id', seller_id)
    })

  const { data, metadata } = await query.graph({
    entity: 'customer',
    fields,
    filters: {
      id: customers.map((c) => c.id)
    },
    pagination
  })

  return { customers: data, count: metadata?.count }
}

export async function selectCustomerOrders(
  container: MedusaContainer,
  seller_id: string,
  customer_id: string,
  pagination: { skip: number; take: number },
  fields: string[] = ['*']
) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const orders = await knex
    .select(fields.map((f) => `order.${f}`))
    .from('order')
    .leftJoin(
      'seller_seller_order_order',
      'order.id',
      'seller_seller_order_order.order_id'
    )
    .where('order.customer_id', customer_id)
    .andWhere('seller_seller_order_order.seller_id', seller_id)
    .limit(pagination.take)
    .offset(pagination.skip)

  const countResult = (await knex
    .countDistinct('order.id')
    .from('order')
    .leftJoin(
      'seller_seller_order_order',
      'order.id',
      'seller_seller_order_order.order_id'
    )
    .where('order.customer_id', customer_id)
    .andWhere('seller_seller_order_order.seller_id', seller_id)) as {
    count: string
  }[]

  return { orders, count: parseInt(countResult[0]?.count || '0') }
}

export async function selectOrdersChartData(
  container: MedusaContainer,
  seller_id: string,
  time_range: [string, string]
): Promise<{ date: Date; count: string }[]> {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const result = await knex('seller_seller_order_order')
    .select(knex.raw(`DATE_TRUNC('DAY', "created_at") AS date`))
    .count('*')
    .where('seller_id', seller_id)
    .andWhereBetween('created_at', time_range)
    .groupByRaw('date')
    .orderByRaw('date asc')

  return result as unknown as { date: Date; count: string }[]
}

export async function selectCustomersChartData(
  container: MedusaContainer,
  seller_id: string,
  time_range: [string, string]
): Promise<{ date: Date; count: string }[]> {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const result = await knex
    .with('customer_first_orders', (qb) => {
      qb.select('customer_id')
        .select(
          knex.raw(
            'MIN(seller_seller_order_order.created_at) as first_order_date'
          )
        )
        .from('order')
        .leftJoin(
          'seller_seller_order_order',
          'order.id',
          'seller_seller_order_order.order_id'
        )
        .where('seller_id', seller_id)
        .groupBy('customer_id')
    })
    .select(knex.raw(`DATE_TRUNC('DAY', "first_order_date") AS date`))
    .count('*')
    .from('customer_first_orders')
    .whereBetween('first_order_date', time_range)
    .groupByRaw('date')
    .orderByRaw('date asc')

  return result as unknown as { date: Date; count: string }[]
}
