import { MedusaNextFunction, MedusaRequest, MedusaResponse, UserRoles, UserService } from '@medusajs/medusa';

export const rolePermissions =
	(...allowedRoles: UserRoles[]) =>
	async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
		if (!req.user || (!req.user.userId && !req.user.id)) {
			return res.sendStatus(401);
		}

		// retrieve currently logged-in user
		const userService = req.scope.resolve('userService') as UserService;
		const loggedInUser = await userService.retrieve(req.user.userId || req.user.id, {
			select: ['role'],
		});

		const isAllowed = allowedRoles.includes(loggedInUser.role);

		if (isAllowed) {
			next();
			return;
		}

		// deny access
		return res.sendStatus(403);
	};
