import { Lifetime } from 'awilix';
import { FindConfig, StoreService as MedusaStoreService, Store, buildQuery } from '@medusajs/medusa';
import { User } from '../models/user';
import StoreRepository from '../repositories/store';
import { MedusaError } from 'medusa-core-utils';

class StoreService extends MedusaStoreService {
	static LIFE_TIME = Lifetime.SCOPED;
	protected readonly loggedInUser_: User | null;
	protected readonly storeRepository_: typeof StoreRepository;

	constructor(container) {
		super(container);
		this.storeRepository_ = container.storeRepository;

		try {
			this.loggedInUser_ = container.loggedInUser;
		} catch (e) {
			// avoid errors when backend first runs
		}
	}

	async retrieve(config?: FindConfig<Store>): Promise<Store> {
		const storeRepo = this.activeManager_.withRepository(this.storeRepository_);

		// If no user is logged in, return the first store
		if (!this.loggedInUser_) {
			return await super.retrieve(config);
		}

		const query = buildQuery(
			{
				id: this.loggedInUser_.store_id,
			},
			config
		);

		const store = await storeRepo.findOne(query);

		if (!store) {
			throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Store does not exist');
		}

		return store;
	}

	async retrieveById(id: string): Promise<Store> {
		const storeRepo = this.activeManager_.withRepository(this.storeRepository_);

		const config = {
			relations: ['currencies', 'default_currency', 'shipping_options'],
		};

		const query = buildQuery({ id }, config);

		const store = await storeRepo.findOne(query);

		if (!store) {
			throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Store does not exist');
		}

		return store;
	}
}

export default StoreService;
