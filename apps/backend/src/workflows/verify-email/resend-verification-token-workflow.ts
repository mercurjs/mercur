import { emitEventStep } from '@medusajs/core-flows';
import { createWorkflow, WorkflowResponse } from '@medusajs/workflows-sdk';

import { REQUESTED_RESEND_VERIFY_EMAIL_EVENT } from '../../shared/constants';
import { createVerifyEmailLinkStep } from './steps/create-verify-email-link-step';

type ResendEmailVerificationTokenWorkflowInput = {
  email: string;
  authIdentityId: string;
};

const resendEmailVerificationTokenWorkflow = createWorkflow(
  'resend-email-verification-token-workflow',
  (input: ResendEmailVerificationTokenWorkflowInput) => {
    const { link } = createVerifyEmailLinkStep({
      authIdentityId: input.authIdentityId,
			email: input.email
    });

    emitEventStep({
      eventName: REQUESTED_RESEND_VERIFY_EMAIL_EVENT,
      data: { email: input.email, link },
    });

    return new WorkflowResponse({ success: true });
  }
);

export default resendEmailVerificationTokenWorkflow;
