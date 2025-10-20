import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { StoreChangePasswordType } from "../../validators";
import Scrypt from "scrypt-kdf";

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreChangePasswordType>,
  res: MedusaResponse
) => {
  const { email, password } = req.validatedBody;

  const authIdentityProviderService = req.scope.resolve(Modules.AUTH);
  const authIdentityId =
    await authIdentityProviderService.listProviderIdentities({
      entity_id: email,
    });

  const hashConfig = { logN: 15, r: 8, p: 1 };
  const passwordHash = await Scrypt.kdf(password, hashConfig);

  const authIdentity =
    await authIdentityProviderService.updateProviderIdentities({
      id: authIdentityId[0].id,
      provider_metadata: {
        password: passwordHash.toString("base64"),
      },
    });

  res.status(200).json({ success: true, auth_identity: authIdentity });
};
