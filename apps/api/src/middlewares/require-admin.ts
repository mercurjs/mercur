import { MedusaNextFunction, MedusaRequest, MedusaResponse, UserService } from '@medusajs/medusa';

export const requireAdmin = () => async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
	if (!req.user || (!req.user.userId && !req.user.id)) {
		return res.sendStatus(401);
	}

	// retrieve currently logged-in user
	const userService = req.scope.resolve('userService') as UserService;
	const loggedInUser = await userService.retrieve(req.user.userId || req.user.id, {
		select: ['is_admin'],
	});

	if (loggedInUser.is_admin) {
		next();
		return;
	}

	// deny access
	return res.sendStatus(403);
};
