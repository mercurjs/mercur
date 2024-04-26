import { dataSource } from '@medusajs/medusa/dist/loaders/database';
import { ShippingOptionRepository as MedusaShippingOptionRepository } from '@medusajs/medusa/dist/repositories/shipping-option';
import { ShippingOption } from '../models/shipping-option';
import { In } from 'typeorm';

export const ShippingOptionRepository = dataSource.getRepository(ShippingOption).extend(
	Object.assign(
		MedusaShippingOptionRepository,
		{ target: ShippingOption },
		{
			async upsertShippingOptions(shipping_option_ids: string[]) {
				const toUpsert = await this.find({
					where: {
						id: In(shipping_option_ids),
					},
				});

				return toUpsert;
			},
		}
	)
);

export default ShippingOptionRepository;
