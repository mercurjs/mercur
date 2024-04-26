import { MedusaRequest, UserService } from '@medusajs/medusa';
import { User } from '../models/user';

export async function registerLoggedInUser(req: MedusaRequest, res, next) {
	let loggedInUser: User | null = null;

	if (req.user && req.user.userId) {
		const userService = req.scope.resolve('userService') as UserService;
		loggedInUser = await userService.retrieve(req.user.userId, {
			select: ['id', 'is_admin', 'status', 'store_id'],
		});
	}

	req.scope.register({
		loggedInUser: {
			resolve: () => loggedInUser,
		},
	});

	next();
}
