import { IAuthModuleService } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';

export type SetAuthAppMetadataStepInput = {
  authIdentityId: string;
  value: boolean | null; // null means delete the key
};

export const setEmailVerifiedMetadataStepId =
  'set-email-verified-metadata-step';
/**
 * This step sets the `app_metadata` property of an auth identity by adding the `email_verified` key with the value value passed to step as input.
 */
export const setEmailVerifiedMetadataStep = createStep(
  setEmailVerifiedMetadataStepId,
  async (data: SetAuthAppMetadataStepInput, { container }) => {
    const service = container.resolve<IAuthModuleService>(Modules.AUTH);

    const key = `email_verified`;
    const authIdentity = await service.retrieveAuthIdentity(
      data.authIdentityId
    );

    const appMetadata = authIdentity.app_metadata || {};

    const oldValue = appMetadata[key];
    appMetadata[key] = data.value;

    await service.updateAuthIdentities({
      id: authIdentity.id,
      app_metadata: appMetadata,
    });

    return new StepResponse(authIdentity, {
      id: authIdentity.id,
      key: key,
      value: data.value,
      oldValue,
    });
  },
  async (idAndKeyAndValue, { container }) => {
    if (!idAndKeyAndValue) {
      return;
    }

    const { id, key, oldValue, value } = idAndKeyAndValue;

    const service = container.resolve<IAuthModuleService>(Modules.AUTH);

    const authIdentity = await service.retrieveAuthIdentity(id);

    const appMetadata = authIdentity.app_metadata || {};

    if (value === null) {
      appMetadata[key] = oldValue;
    } else {
      delete appMetadata[key];
    }

    await service.updateAuthIdentities({
      id: authIdentity.id,
      app_metadata: appMetadata,
    });
  }
);
