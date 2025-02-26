import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export async function selectSellerCustomers(
  container: MedusaContainer,
  seller_id: string,
  pagination: { skip: number; take: number }
) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const customers = await knex
    .select('*')
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

  const [{ count }] = (await knex
    .countDistinct('customer_id')
    .from('order')
    .leftJoin(
      'seller_seller_order_order',
      'order.id',
      'seller_seller_order_order.order_id'
    )
    .where('seller_id', seller_id)
    .groupBy('customer_id')) as { count: string }[]

  return { customers, count: parseInt(count) }
}
