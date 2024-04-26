import { Entity, OneToMany } from 'typeorm';
import { Store as MedusaStore } from '@medusajs/medusa';
import { User } from './user';
import { Product } from './product';
import { Order } from './order';
import { ShippingOption } from './shipping-option';
import { Invite } from './invite';

@Entity()
export class Store extends MedusaStore {
	@OneToMany(() => User, (user) => user.store)
	members: User[];

	@OneToMany(() => Product, (product) => product?.store)
	products: Product[];

	@OneToMany(() => Order, (order) => order?.store)
	orders: Order[];

	@OneToMany(() => ShippingOption, (shippingOption) => shippingOption.store)
	shipping_options: ShippingOption[];

	@OneToMany(() => Invite, (invite) => invite.store)
	invites: Invite[];
}
