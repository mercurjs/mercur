import { UserRoles } from '../models/user';

export const isRoleAdmin = (role: UserRoles) =>
	role === UserRoles.ADMIN || role === UserRoles.DEVELOPER || role === UserRoles.MEMBER;
