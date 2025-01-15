import { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import { IAuthModuleService } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';
import { MedusaError } from '@medusajs/utils';

import { isNil } from '../../../shared/utils/nil';
import resendEmailVerificationTokenWorkflow from '../../../workflows/verify-email/resend-verification-token-workflow';
import { ResendEmailVerificationLinkType } from '../validators';

/**
 * @oas [post] /email/resend
 * summary: Resend Email Verification
 * description: Resend email verification
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         description: The email to resend the verification email link
 *         properties:
 *           email:
 *             type: string
 *             title: email
 *             description: The email to resend the verification email link
 * tags:
 *   - Verify Email
 * responses:
 *   "200":
 *     description: OK
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */
export const POST = async (
  req: MedusaRequest<ResendEmailVerificationLinkType>,
  res: MedusaResponse
) => {
  try {
    const authIdentityService = req.scope.resolve<IAuthModuleService>(
      Modules.AUTH
    );

    const authIdentity = await authIdentityService.listAuthIdentities({
      provider_identities: {
        entity_id: req.body.email,
      },
    });


    if (isNil(authIdentity)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'Auth identity not found'
      );
    }

    await resendEmailVerificationTokenWorkflow(req.scope).run({
      input: {
        email: req.body.email,
        authIdentityId: authIdentity[0].id,
      },
    });

    res.sendStatus(200);
  } catch (error) {
    if (error.type === MedusaError.Types.NOT_FOUND) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    res.send({ success: false, error: error.message });
  }
};
