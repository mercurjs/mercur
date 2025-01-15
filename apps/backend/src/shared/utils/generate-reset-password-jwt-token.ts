import { ConfigModule, MedusaContainer } from '@medusajs/framework/types';
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
} from '@medusajs/framework/utils';
import { generateJwtTokenForAuthIdentity } from '@medusajs/medusa/api/auth/utils/generate-jwt-token';

export const generateResetPasswordJwtToken = async (
  authId: string,
  actorType: 'user' | 'vendor' | 'customer' | 'seller',
  container: MedusaContainer
): Promise<string> => {
  const config: ConfigModule = container.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  );
  const authModuleService = container.resolve(ModuleRegistrationName.AUTH);
  const { http } = config.projectConfig;

  const authIdentity = await authModuleService.retrieveAuthIdentity(authId);

  return generateJwtTokenForAuthIdentity(
    {
      authIdentity,
      actorType: actorType,
    },
    {
      secret: http.jwtSecret,
      expiresIn: '5m',
    }
  );
};
