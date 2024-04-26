import { type SubscriberConfig, type SubscriberArgs, OrderService, LineItem } from '@medusajs/medusa';
import OrderRepository from '../repositories/order';
import { EntityManager } from 'typeorm';

/**
 * Subscribers that listen to the `order-placed` event.
 * Subscribers creates "children" orders for each store in the order.
 */
export default async function orderPlacedHandler({ data, container }: SubscriberArgs<Record<string, any>>) {
	const orderService: OrderService = container.resolve('orderService');
	const orderRepository_: typeof OrderRepository = container.resolve('orderRepository');
	const manager: EntityManager = container.resolve('manager');

	await manager.transaction(async (manager) => {
		const orderRepo = manager.withRepository(orderRepository_);
		const order = await orderService.withTransaction(manager).retrieveWithTotals(data.id, {
			relations: ['items', 'items.variant', 'items.variant.product'],
		});

		const storeProductsMap = new Map<string, LineItem[]>();

		// Grouping line items by store id in a map
		for (const lineItem of order.items) {
			const storeProducts = storeProductsMap.get(lineItem.variant.product.store_id);

			storeProductsMap.set(lineItem.variant.product.store_id, [...(storeProducts ?? []), lineItem]);
		}

		for (const [storeId, lineItems] of storeProductsMap) {
			// Calculate total for each store
			const totals = lineItems.reduce(
				(acc, item) => {
					return {
						subtotal: acc.subtotal + item.subtotal,
						tax_total: acc.tax_total + item.tax_total,
						total: acc.total + item.total,
						original_total: acc.original_total + item.original_total,
						original_tax_total: acc.original_tax_total + item.original_tax_total,
						discount_total: acc.discount_total + item.discount_total,
						raw_discount_total: acc.raw_discount_total + item.raw_discount_total,
						gift_card_total: acc.gift_card_total + item.gift_card_total,
					};
				},
				{
					subtotal: 0,
					tax_total: 0,
					total: 0,
					original_total: 0,
					original_tax_total: 0,
					discount_total: 0,
					raw_discount_total: 0,
					gift_card_total: 0,
				}
			);

			// Create a new order for each store
			const storeOrder = orderRepo.create({
				parent_id: order.id,
				items: lineItems,
				store_id: storeId,
				...totals,
			});

			await orderRepo.save(storeOrder);
		}
	});
}

export const config: SubscriberConfig = {
	event: [OrderService.Events.PLACED],
	context: {
		subscriberId: 'order-placed-handler',
	},
};
