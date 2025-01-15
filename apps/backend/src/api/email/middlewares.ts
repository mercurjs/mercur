import {
  validateAndTransformBody,
} from '@medusajs/framework/http';

import { MiddlewareRoute } from '@medusajs/medusa';

import { ResendEmailVerificationLinkSchema } from './validators';

export const verifyEmailMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/email/verify-email',
    method: 'POST',
  },
  {
    matcher: '/email/resend',
    method: 'POST',
    middlewares: [validateAndTransformBody(ResendEmailVerificationLinkSchema)],
  }
];
