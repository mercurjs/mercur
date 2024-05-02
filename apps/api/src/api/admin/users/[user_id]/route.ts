import { MedusaRequest, MedusaResponse, validator } from '@medusajs/medusa';
import UserService from '../../../../services/user';
import { EntityManager } from 'typeorm';
import { AdminUpdateUserRequest } from './validators';
import { User, UserPermission } from '../../../../models/user';

/**
 * Overwriting medusa endpoint to validate based on logged in user role
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
	const loggedInUser: User = req.scope.resolve('loggedInUser');
	const userService: UserService = req.scope.resolve('userService');

	const { user_id } = req.params;

	const permission = loggedInUser.is_admin ? UserPermission.ADMIN : UserPermission.VENDOR;

	const validated = await validator(AdminUpdateUserRequest, req.body, {
		groups: [permission],
		always: true,
	});

	const manager: EntityManager = req.scope.resolve('manager');
	const data = await manager.transaction(async (transactionManager) => {
		return await userService.withTransaction(transactionManager).update(user_id, validated);
	});

	res.status(200).json({ user: data });
};
