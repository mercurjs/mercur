import { Store } from '../models/store';
import { dataSource } from '@medusajs/medusa/dist/loaders/database';
import { StoreRepository as MedusaStoreRepository } from '@medusajs/medusa/dist/repositories/store';

export const StoreRepository = dataSource
	.getRepository(Store)
	.extend(Object.assign(MedusaStoreRepository, { target: Store }));

export default StoreRepository;
