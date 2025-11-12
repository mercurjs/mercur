import { MedusaContainer } from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

type OrderDirection = 'ASC' | 'DESC' | 'asc' | 'desc';
export type OrderObject = Record<string, OrderDirection | Record<string, OrderDirection>>;

const cleanKey = (key: string): string => {
  return key.split('=').pop()?.replace(/^\*/, '') || key;
};

const normalizeDirection = (direction: string): 'asc' | 'desc' => {
  return direction.toLowerCase() === 'desc' ? 'desc' : 'asc';
};

const addOrderEntry = (
  orderBy: Array<{ column: string; order: 'asc' | 'desc' }>,
  key: string,
  direction: string
): void => {
  const column = key.includes('.') ? key : `product.${key}`;
  orderBy.push({ column, order: normalizeDirection(direction) });
};

const parseOrderForKnex = (
  order: OrderObject | null | undefined
): Array<{ column: string; order: 'asc' | 'desc' }> => {
  if (!order || typeof order !== 'object') {
    return [];
  }

  const orderBy: Array<{ column: string; order: 'asc' | 'desc' }> = [];

  for (const [key, value] of Object.entries(order)) {
    if (typeof value === 'string') {
      addOrderEntry(orderBy, cleanKey(key), value);
    } else if (value && typeof value === 'object') {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (typeof nestedValue === 'string') {
          addOrderEntry(orderBy, nestedKey, nestedValue);
        }
      }
    }
  }

  return orderBy;
};

export const filterProductsBySeller = async (
  container: MedusaContainer,
  sellerId: string,
  skip: number,
  take: number,
  salesChannelId?: string,
  order?: OrderObject
) => {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  let baseQuery = knex('product')
    .distinct('product.id')
    .innerJoin(
      'seller_seller_product_product',
      'product.id',
      'seller_seller_product_product.product_id'
    )
    .where({
      'seller_seller_product_product.seller_id': sellerId,
      'seller_seller_product_product.deleted_at': null,
      'product.deleted_at': null
    });

  if (salesChannelId) {
    baseQuery = baseQuery
      .innerJoin(
        'product_sales_channel',
        'product.id',
        'product_sales_channel.product_id'
      )
      .where('product_sales_channel.sales_channel_id', salesChannelId)
  }

  const countQuery = baseQuery
    .clone()
    .clearSelect()
    .count('product.id as count')
  const [{ count }] = await countQuery
  const totalCount = parseInt(count as string, 10)

  if (order) {
    const parsedOrder = parseOrderForKnex(order);
    if (parsedOrder.length > 0) {
      const orderColumns = parsedOrder.map(o => o.column);
      const selectColumns = ['product.id', ...orderColumns.filter(col => col !== 'product.id')];
      
      baseQuery = baseQuery.distinct(...selectColumns);
      baseQuery = baseQuery.orderBy(parsedOrder);
    }
  }

  const productIds = await baseQuery
    .offset(skip)
    .limit(take)
    .pluck('product.id')

  return { productIds, count: totalCount }
}
