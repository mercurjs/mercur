import { Lifetime } from 'awilix';
import { ShippingOptionService as MedusaShippingOptionService, Selector, FindConfig } from '@medusajs/medusa';
import { User } from '../models/user';
import { MedusaError } from '@medusajs/utils';
import { CreateShippingOptionInput as MedusaCreateShippingOptionInput } from '@medusajs/medusa/dist/types/shipping-options';
import { ShippingOption } from '../models/shipping-option';

type CreateShippingOptionInput = {
	store_id?: string;
} & MedusaCreateShippingOptionInput;

class ShippingOptionService extends MedusaShippingOptionService {
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

	async retrieve(optionId: any, options?: FindConfig<ShippingOption>): Promise<ShippingOption> {
		const shippingOption = await super.retrieve(optionId, options);

		if (this.loggedInUser_?.store_id && shippingOption.store_id !== this.loggedInUser_.store_id) {
			throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Shipping option does not exist');
		}

		return shippingOption;
	}

	private prepareListConfig_(selector: Selector<ShippingOption> & { store_id?: string }) {
		if (this.loggedInUser_?.store_id) {
			selector = selector || {};
			selector.store_id = this.loggedInUser_.store_id;
		}
	}

	async list(
		selector: Selector<ShippingOption> & { q?: string; store_id?: string } = {},
		config?: FindConfig<ShippingOption>
	): Promise<ShippingOption[]> {
		this.prepareListConfig_(selector);

		return await super.list(selector, config);
	}

	async listAndCount(
		selector?: Selector<ShippingOption> & { q?: string; store_id?: string },
		config?: FindConfig<ShippingOption>
	): Promise<[ShippingOption[], number]> {
		this.prepareListConfig_(selector);

		return await super.listAndCount(selector, config);
	}

	async create(data: CreateShippingOptionInput): Promise<ShippingOption> {
		if (this.loggedInUser_?.store_id) {
			data.store_id = this.loggedInUser_.store_id;
		}

		return await super.create(data);
	}
}

export default ShippingOptionService;
