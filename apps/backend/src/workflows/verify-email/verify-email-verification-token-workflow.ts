import { emitEventStep } from '@medusajs/core-flows';
import { createWorkflow, WorkflowResponse } from '@medusajs/workflows-sdk';

import { SELLER_EMAIL_VERIFIED } from '../../shared/constants';
import { setEmailVerifiedMetadataStep } from './steps/set-email-verified-metadata-step';
import verifyVerificationEmailTokenStep from './steps/verify-email-verification-token-step';

type VerifyEmailVerificationTokenWorkflowInput = {
  token: string;
};

const verifyEmailVerificationTokenWorkflow = createWorkflow(
  'verify-email-verification-token-workflow',
  (input: VerifyEmailVerificationTokenWorkflowInput) => {
    const { authIdentityId, email } = verifyVerificationEmailTokenStep({
      token: input.token,
    });

    setEmailVerifiedMetadataStep({
      authIdentityId: authIdentityId,
      value: true,
    });

    emitEventStep({
      eventName: SELLER_EMAIL_VERIFIED,
      data: { email, dashboard_link: process.env.FRONTEND_URL },
    });

    return new WorkflowResponse({ success: true });
  }
);

export default verifyEmailVerificationTokenWorkflow;
