import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User as MedusaUser } from '@medusajs/medusa';
import { Store } from './store';

export enum UserStatus {
	PENDING = 'pending',
	ACTIVE = 'active',
	REJECTED = 'rejected',
}

export enum UserPermission {
	ADMIN = 'admin',
	VENDOR = 'vendor',
}

@Entity()
export class User extends MedusaUser {
	@Index('UserStoreId')
	@Column({ nullable: true })
	store_id: string | null;

	@ManyToOne(() => Store, (store) => store.members)
	@JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
	store: Store | null;

	@Column({ type: 'bool', default: false, select: false })
	is_admin: boolean;

	@Column({ type: 'enum', enum: UserStatus })
	status: UserStatus;
}
