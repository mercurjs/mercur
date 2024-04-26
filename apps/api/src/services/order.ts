import { Lifetime } from 'awilix';
import { OrderService as MedusaOrderService, Selector, FindConfig } from '@medusajs/medusa';
import { User } from '../models/user';
import { Order } from '../models/order';
import { MedusaError } from '@medusajs/utils';

type OrderSelector = {
	store_id?: string;
} & Selector<Order>;

class OrderService extends MedusaOrderService {
	static LIFE_TIME = Lifetime.SCOPED;
	protected readonly loggedInUser_: User | null;

	constructor(container) {
		super(container);

		try {
			this.loggedInUser_ = container.loggedInUser;
		} catch (e) {
			// avoid errors when backend first runs
		}
	}

	private prepareListConfig_(selector: OrderSelector) {
		if (!selector.store_id && this.loggedInUser_?.store_id) {
			selector.store_id = this.loggedInUser_.store_id;
		}
	}

	async list(selector: OrderSelector, config: FindConfig<Order>) {
		this.prepareListConfig_(selector);

		return await super.list(selector, config);
	}

	async listAndCount(selector: OrderSelector, config: FindConfig<Order>) {
		this.prepareListConfig_(selector);

		return await super.listAndCount(selector, config);
	}

	async retrieve(orderId: string, config?: FindConfig<Order>) {
		const order = await super.retrieve(orderId, config);

		if (order.store_id && this.loggedInUser_.store_id && order.store_id !== this.loggedInUser_.store_id) {
			// Throw error if you don't want a order to be accessible to other stores
			throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Order does not exist');
		}

		return order;
	}
}

export default OrderService;
