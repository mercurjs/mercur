import { IsOptional, IsString, IsEnum, IsEmpty } from 'class-validator';
import { UserStatus } from '../../../../models/user';
import { UserRoles } from '@medusajs/medusa';
import { UserPermission } from '../../../../models/user';

export class AdminUpdateUserRequest {
	@IsString()
	@IsOptional()
	first_name?: string;

	@IsString()
	@IsOptional()
	last_name?: string;

	@IsEnum(UserRoles)
	@IsEmpty({
		groups: [UserPermission.VENDOR],
	})
	@IsOptional()
	role?: UserRoles;

	@IsEnum(UserStatus)
	@IsEmpty({
		groups: [UserPermission.VENDOR],
	})
	@IsOptional()
	status?: UserStatus;
}
