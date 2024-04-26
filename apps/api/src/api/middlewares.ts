import { MiddlewaresConfig, authenticate } from '@medusajs/medusa';
import { adminRegisterMiddlewares } from './auth/register/middlewares';
import cors from 'cors';
import { adminCors } from '../util/cors';
import { registerLoggedInUser } from '../middlewares/register-logged-in-user';
import { restrictedAdminMiddlewares } from '../util/restricted-admin-middlewares';

export const config: MiddlewaresConfig = {
	routes: [
		{
			// Authenticate all /admin routes except /auth and /admin/invites/accept
			matcher: /^\/admin\/(?!auth|invites\/accept).*$/,
			middlewares: [cors(adminCors), authenticate(), registerLoggedInUser],
		},
		...adminRegisterMiddlewares,
		...restrictedAdminMiddlewares,
	],
};
