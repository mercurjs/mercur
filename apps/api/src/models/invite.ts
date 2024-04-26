import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Invite as MedusaInvite } from '@medusajs/medusa';
import { Store } from './store';

@Entity()
export class Invite extends MedusaInvite {
	@Column({ default: false, type: 'bool' })
	is_admin: boolean;

	@Index('InviteStoreId')
	@Column({ nullable: true })
	store_id: string;

	@ManyToOne(() => Store, (store) => store.invites)
	@JoinColumn({ name: 'store_id' })
	store: Store;
}
