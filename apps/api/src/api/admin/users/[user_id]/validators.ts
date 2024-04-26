import { IsOptional, IsString, IsEnum, IsEmpty } from 'class-validator';
import { UserStatuses } from '../../../../models/user';
import { UserRoles } from '@medusajs/medusa';
import { UserPermissions } from '../../../../models/user';

export class AdminUpdateUserRequest {
	@IsString()
	@IsOptional()
	first_name?: string;

	@IsString()
	@IsOptional()
	last_name?: string;

	@IsEnum(UserRoles)
	@IsEmpty({
		groups: [UserPermissions.VENDOR],
	})
	@IsOptional()
	role?: UserRoles;

	@IsEnum(UserStatuses)
	@IsEmpty({
		groups: [UserPermissions.VENDOR],
	})
	@IsOptional()
	status?: UserStatuses;
}
