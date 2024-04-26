import { Order } from '../models/order';
import { dataSource } from '@medusajs/medusa/dist/loaders/database';
import { OrderRepository as MedusaOrderRepository } from '@medusajs/medusa/dist/repositories/order';

export const OrderRepository = dataSource.getRepository(Order).extend(
	Object.assign(
		MedusaOrderRepository,
		{ target: Order },
		{
			async bulkUpdate(input: any, ...whereClause: [string, Record<string, any>]) {
				await this.createQueryBuilder().update().set(input).where(whereClause).execute();
			},
		}
	)
);

export default OrderRepository;
