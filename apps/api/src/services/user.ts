import { Lifetime } from 'awilix';
import { FindConfig, UserService as MedusaUserService, buildQuery } from '@medusajs/medusa';
import { User, UserStatus } from '../models/user';
import { FilterableUserProps, CreateUserInput as MedusaCreateUserInput } from '@medusajs/medusa/dist/types/user';
import StoreService from './store';
import { EntityManager } from 'typeorm';
import { MedusaError } from '@medusajs/utils';
import { Selector } from '@medusajs/types';

type CreateUserInput = {
	store_id?: string;
	status?: UserStatus;
	is_admin?: boolean;
} & MedusaCreateUserInput;

class UserService extends MedusaUserService {
	static LIFE_TIME = Lifetime.SCOPED;
	protected readonly loggedInUser_: User | null;
	protected readonly storeService: StoreService;

	constructor(container) {
		super(container);
		this.storeService = container.storeService;

		try {
			this.loggedInUser_ = container.loggedInUser;
		} catch (e) {
			// avoid errors when backend first runs
		}
	}

	/**
	 * Assigns store_id to selector if not provided
	 * @param selector
	 */
	private prepareListConfig_(selector?: Selector<User>) {
		selector = selector || {};

		if (this.loggedInUser_?.store_id && !selector.store_id) {
			selector.store_id = this.loggedInUser_.store_id;
		}
	}

	/**
	 * Create a new user and assigns it to a store if not provided
	 * @param user
	 * @param password
	 * @returns {Promise<User>}
	 */
	async create(user: CreateUserInput, password: string): Promise<User> {
		return await this.atomicPhase_(async (transactionManager: EntityManager) => {
			if (!user.store_id) {
				const newStore = await this.storeService.withTransaction(transactionManager).create();

				user.store_id = newStore.id;
			}

			return await super.create(user, password);
		});
	}

	async retrieve(userId: string, config?: FindConfig<User>): Promise<User> {
		const user = await super.retrieve(userId, config);

		// If logged in user is not admin, we check if the user is from the same store
		if (user.store_id && this.loggedInUser_?.store_id && user.store_id !== this.loggedInUser_.store_id) {
			throw new MedusaError(MedusaError.Types.NOT_FOUND, 'User does not exist');
		}

		return user;
	}

	/**
	 * This method is used to authenticate user
	 * If the user is not approved, we throw an error
	 * @param email
	 * @param config
	 * @returns
	 */
	async retrieveByEmail(email: string, config: FindConfig<User> = {}): Promise<User> {
		const userRepo = this.activeManager_.withRepository(this.userRepository_);

		const query = buildQuery(
			{
				email: email.toLowerCase(),
				status: UserStatus.ACTIVE,
			},
			config
		);
		const user = await userRepo.findOne(query);

		if (!user) {
			throw new MedusaError(MedusaError.Types.NOT_FOUND, `User with email: ${email} was not found`);
		}

		return user;
	}

	async list(selector?: Selector<User> & { q?: string }, config?: FindConfig<FilterableUserProps>): Promise<User[]> {
		this.prepareListConfig_(selector);

		return await super.list(selector, config);
	}

	async listAndCount(
		selector?: Selector<User> & { q?: string },
		config?: FindConfig<FilterableUserProps>
	): Promise<[User[], number]> {
		this.prepareListConfig_(selector);

		return await super.listAndCount(selector, config);
	}
}

export default UserService;
