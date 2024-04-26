import { type SubscriberConfig, type SubscriberArgs, OrderService } from '@medusajs/medusa';
import OrderRepository from '../repositories/order';
import { EntityManager } from 'typeorm';

/**
 * Subscribers that listen to the `order-status-updated` event and updates children orders
 */
export default async function orderStatusHandler({ data, container }: SubscriberArgs<Record<string, any>>) {
	const orderService: OrderService = container.resolve('orderService');
	const orderRepository_: typeof OrderRepository = container.resolve('orderRepository');
	const manager: EntityManager = container.resolve('manager');

	const order = await orderService.retrieve(data.id);

	// If order is a child order, we don't want to update related products
	if (order.parent_id) {
		return;
	}

	await manager.transaction(async (manager) => {
		const orderRepo = manager.withRepository(orderRepository_);

		await orderRepo.bulkUpdate(
			{
				status: order.status,
				payment_status: order.payment_status,
				fulfillment_status: order.fulfillment_status,
			},
			'parent_id = :parentId',
			{ parentId: order.id }
		);
	});
}

export const config: SubscriberConfig = {
	event: [OrderService.Events.UPDATED],
	context: {
		subscriberId: 'order-status-handler',
	},
};
