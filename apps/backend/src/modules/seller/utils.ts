import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export async function selectSellerCustomers(
  container: MedusaContainer,
  seller_id: string,
  pagination: { skip: number; take: number },
  fields: string[] = ['*']
) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const customers = await knex
    .select(fields)
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
        .limit(pagination.take)
        .offset(pagination.skip)
    })

  const countResult = (await knex
    .countDistinct('customer_id')
    .from('order')
    .leftJoin(
      'seller_seller_order_order',
      'order.id',
      'seller_seller_order_order.order_id'
    )
    .where('seller_id', seller_id)
    .groupBy('customer_id')) as { count: string }[]

  return { customers, count: parseInt(countResult[0]?.count || '0') }
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
