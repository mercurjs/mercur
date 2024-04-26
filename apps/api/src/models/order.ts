import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { Order as MedusaOrder } from '@medusajs/medusa';
import { Store } from './store';

@Entity()
export class Order extends MedusaOrder {
	@Index('OrderStoreId')
	@Column({ nullable: true })
	store_id: string | null;

	@ManyToOne(() => Store, (store) => store.orders, { nullable: true })
	@JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
	store: Store | null;

	@ManyToOne(() => Order, (order) => order.children, { nullable: true })
	@JoinColumn({ name: 'order_parent_id' })
	parent: Order | null;

	@OneToMany(() => Order, (order) => order.parent)
	@JoinColumn({ name: 'id', referencedColumnName: 'order_parent_id' })
	children: Order[];
}
