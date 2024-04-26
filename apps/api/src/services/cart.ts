import { CartService as MedusaCartService } from '@medusajs/medusa';
import { MedusaError } from '@medusajs/utils';
import { EntityManager } from 'typeorm';

class CartService extends MedusaCartService {
	constructor(container) {
		super(container);
	}

	/**
	 * Extending remove lineItem to remove shipping methods
	 */
	async removeLineItem(cartId: string, lineItemId: string | string[]): Promise<void> {
		return await this.atomicPhase_(async (transactionManager: EntityManager) => {
			const lineItems = Array.isArray(lineItemId) ? lineItemId : [lineItemId];
			const cart = await this.retrieve(cartId, {
				relations: ['shipping_methods'],
			});

			const shippingMethodsToRemove = cart.shipping_methods.filter((sm) => {
				lineItems.includes(sm.data.line_item_id as string);
			});

			await this.shippingOptionService_
				.withTransaction(transactionManager)
				.deleteShippingMethods(shippingMethodsToRemove);

			return super.removeLineItem(cartId, lineItemId);
		});
	}

	async addShippingMethodToLineItem(cartId: string, lineItemId: string, optionId: string) {
		return await this.atomicPhase_(async (transactionManager: EntityManager) => {
			const lineItem = await this.lineItemService_.retrieve(lineItemId, {
				relations: ['variant', 'variant.product', 'variant.product.shipping_options'],
			});

			if (!lineItem.variant.product.shipping_options.find((so) => so.id === optionId)) {
				throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Shipping option not found for line item');
			}

			const cart = await this.retrieve(cartId, {
				relations: ['shipping_methods'],
			});

			const shippingMethodsToRemove = cart.shipping_methods.filter((sm) => sm.data.line_item_id === lineItemId);

			await this.shippingOptionService_
				.withTransaction(transactionManager)
				.deleteShippingMethods(shippingMethodsToRemove);

			await this.shippingOptionService_.withTransaction(transactionManager).createShippingMethod(
				optionId,
				{
					line_item_id: lineItemId,
				},
				{ cart_id: cartId }
			);
		});
	}
}

export default CartService;
