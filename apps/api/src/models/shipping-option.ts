import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { ShippingOption as MedusaShippingOption } from '@medusajs/medusa';
import { Store } from './store';
import { Product } from './product';

@Entity()
export class ShippingOption extends MedusaShippingOption {
	@Index('ShippingOptionStoreId')
	@Column()
	store_id: string;

	@ManyToOne(() => Store, (store) => store.shipping_options)
	@JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
	store: Store;

	@ManyToMany(() => Product, { cascade: true })
	@JoinTable({
		name: 'product_shipping_options',
		joinColumn: {
			name: 'shipping_option_id',
			referencedColumnName: 'id',
		},
		inverseJoinColumn: {
			name: 'product_id',
			referencedColumnName: 'id',
		},
	})
	products: Product[];
}
