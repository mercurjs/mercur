import { IsString } from 'class-validator';

export class StorePostCartsCartShippingMethodReq {
	@IsString()
	option_id: string;

	@IsString()
	line_item_id: string;
}
