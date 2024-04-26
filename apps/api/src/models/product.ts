import { JoinTable, Entity, JoinColumn, ManyToMany, ManyToOne, Index, Column } from 'typeorm';
import { Store } from './store';
import { Product as MedusaProduct } from '@medusajs/medusa';
import { ShippingOption } from './shipping-option';

@Entity()
export class Product extends MedusaProduct {
	@Index('ProductStoreId')
	@Column({ nullable: true })
	store_id: string | null;

	@ManyToOne(() => Store, (store) => store.products)
	@JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
	store: Store | null;

	@ManyToMany(() => ShippingOption, { cascade: true })
	@JoinTable({
		name: 'product_shipping_options',
		joinColumn: {
			name: 'product_id',
			referencedColumnName: 'id',
		},
		inverseJoinColumn: {
			name: 'shipping_option_id',
			referencedColumnName: 'id',
		},
	})
	shipping_options: ShippingOption[];
}
