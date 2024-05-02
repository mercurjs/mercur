import { IsString } from 'class-validator';

/**
 * @schema StorePostCartsCartShippingMethodReq
 * type: object
 * description: "Add shipping method to cart"
 * properties:
 *   option_id:
 *     type: string
 *   line_item_id:
 *     type: string
 */
export class StorePostCartsCartShippingMethodReq {
	@IsString()
	option_id: string;

	@IsString()
	line_item_id: string;
}
