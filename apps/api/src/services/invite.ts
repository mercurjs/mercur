import MedusaInviteService from '@medusajs/medusa/dist/services/invite';
import { Lifetime } from 'awilix';
import { MedusaError } from '@medusajs/utils';
import { Selector, UserRoles } from '@medusajs/medusa';
import UserService from './user';
import { User, UserStatus } from '../models/user';
import { Invite } from '../models/invite';
import InviteRepository from '../repositories/invite';

const DEFAULT_VALID_DURATION = 1000 * 60 * 60 * 24 * 7;

class InviteService extends MedusaInviteService {
	static LIFE_TIME = Lifetime.SCOPED;

	protected readonly loggedInUser_: User | null;

	protected readonly inviteRepository_: typeof InviteRepository;

	protected readonly userService_: UserService;

	constructor(container) {
		// @ts-expect-error prefer-rest-params
		super(...arguments);

		try {
			this.loggedInUser_ = container.loggedInUser;
		} catch (e) {
			// avoid errors when backend first runs
		}
	}

	async create(user: string, role: UserRoles, validDuration: number = DEFAULT_VALID_DURATION) {
		return await this.atomicPhase_(async (manager) => {
			const inviteRepository = this.activeManager_.withRepository(this.inviteRepository_);

			const userRepo = this.activeManager_.withRepository(this.userRepo_);

			const userEntity = await userRepo.findOne({
				where: { email: user },
			});

			if (userEntity) {
				throw new MedusaError(MedusaError.Types.INVALID_DATA, "Can't invite a user with an existing account");
			}

			let invite = await inviteRepository.findOne({
				where: { user_email: user },
			});
			// if user is trying to send another invite for the same account + email, but with a different role
			// then change the role on the invite as long as the invite has not been accepted yet
			if (invite && !invite.accepted && invite.role !== role) {
				invite.role = role;
				invite.store_id = this.loggedInUser_.store_id;

				invite = await inviteRepository.save(invite);
			} else if (!invite) {
				// if no invite is found, create a new one
				const created = inviteRepository.create({
					role,
					token: '',
					user_email: user,
					store_id: this.loggedInUser_.store_id,
					is_admin: this.loggedInUser_.is_admin,
				});

				invite = await inviteRepository.save(created);
			}

			invite.token = this.generateToken({
				invite_id: invite.id,
				role,
				user_email: user,
			});

			invite.expires_at = new Date();
			invite.expires_at.setMilliseconds(invite.expires_at.getMilliseconds() + validDuration);

			invite = await inviteRepository.save(invite);

			await this.eventBus_.withTransaction(manager).emit(InviteService.Events.CREATED, {
				id: invite.id,
				token: invite.token,
				user_email: invite.user_email,
			});
		});
	}

	async accept(token: string, user_): Promise<User> {
		let decoded;
		try {
			decoded = this.verifyToken(token);
		} catch (err) {
			throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Token is not valid');
		}

		const { invite_id, user_email } = decoded;

		return await this.atomicPhase_(async (manager) => {
			const userRepo = manager.withRepository(this.userRepo_);
			const inviteRepo: typeof InviteRepository = manager.withRepository(this.inviteRepository_);

			const invite = await inviteRepo.findOne({ where: { id: invite_id } });

			if (!invite || invite?.user_email !== user_email || new Date() > invite.expires_at) {
				throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid invite`);
			}

			const exists = await userRepo.findOne({
				where: { email: user_email.toLowerCase() },
				select: ['id'],
			});

			if (exists) {
				throw new MedusaError(MedusaError.Types.INVALID_DATA, 'User already joined');
			}

			// use the email of the user who actually accepted the invite
			const user = await this.userService_.withTransaction(manager).create(
				{
					email: invite.user_email,
					role: invite.role,
					first_name: user_.first_name,
					last_name: user_.last_name,
					store_id: invite.store_id,
					is_admin: invite.is_admin,
					status: UserStatus.ACTIVE,
				},
				user_.password
			);

			await inviteRepo.delete({ id: invite.id });

			return user;
		}, 'SERIALIZABLE');
	}

	async list(selector: Selector<Invite> = {}, config = {}) {
		if (this.loggedInUser_) {
			selector = {
				...selector,
				store_id: this.loggedInUser_.store_id,
			};
		}

		return await super.list(selector, config);
	}
}

export default InviteService;
