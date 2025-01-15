import { MedusaRequest, MedusaResponse } from '@medusajs/framework';

import verifyEmailVerificationTokenWorkflow from '../../../workflows/verify-email/verify-email-verification-token-workflow';

/**
 * @oas [post] /email/verify-email/{token}
 * summary: Verify Email
 * description: Verify email
 * x-authenticated: true
 * parameters:
 *   - name: token
 *     in: path
 *     description: The token to verify if the email is valid
 *     required: true
 *     schema:
 *       type: string
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
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  await verifyEmailVerificationTokenWorkflow(req.scope).run({
    input: {
      token: req.query.token as string,
    },
  });

  res.sendStatus(200);
};
