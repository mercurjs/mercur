import {
	MedusaRequest,
	MedusaResponse,
	ProductVariantInventoryService,
	cleanResponseData,
	defaultStoreCartFields,
	defaultStoreCartRelations,
	validator,
} from '@medusajs/medusa';
import CartService from '../../../../../services/cart';
import { EntityManager } from 'typeorm';
import { StorePostCartsCartShippingMethodReq } from './validators';

// Overwrite the shipping methods route to include line item shipping method
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
	const validated = await validator(StorePostCartsCartShippingMethodReq, req.body);

	const { id } = req.params;

	const manager: EntityManager = req.scope.resolve('manager');
	const cartService: CartService = req.scope.resolve('cartService');
	const productVariantInventoryService: ProductVariantInventoryService = req.scope.resolve(
		'productVariantInventoryService'
	);

	await manager.transaction(async (m) => {
		const txCartService = cartService.withTransaction(m);

		await txCartService.addShippingMethodToLineItem(id, validated.line_item_id, validated.option_id);

		const updated = await txCartService.retrieve(id, {
			select: ['id'],
			relations: ['payment_sessions'],
		});

		if (updated.payment_sessions?.length) {
			await txCartService.setPaymentSessions(id);
		}
	});

	const data = await cartService.retrieveWithTotals(id, {
		select: defaultStoreCartFields,
		relations: defaultStoreCartRelations,
	});

	await productVariantInventoryService.setVariantAvailability(
		data.items.map((i) => i.variant),
		data.sales_channel_id!
	);

	res.status(200).json({ cart: cleanResponseData(data, []) });
};
