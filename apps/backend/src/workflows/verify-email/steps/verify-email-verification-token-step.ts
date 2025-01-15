import { MedusaError } from '@medusajs/utils';
import { createStep, StepResponse } from '@medusajs/workflows-sdk';
import jwt from 'jsonwebtoken';

const verifyEmailVerificationTokenStep = createStep(
  'verify-verification-email-token-step',
  async ({ token }: { token: string }) => {
    const verifyToken = (
      token: string,
      secret: string
    ): { authIdentityId: string; email: string } => {
      try {
        const decoded = jwt.verify(token, secret) as {
          email: string;
          expiresAt: number;
          authIdentityId: string;
        };
        if (Date.now() > decoded.expiresAt) {
					throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Token expired');
        }
        return {
					authIdentityId: decoded.authIdentityId,
					email: decoded.email,
				};
      } catch (e) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid token - ${e}`);
      }
    };

		if(!process.env.JWT_SECRET) {
			throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        'Environmental variable JWT_SECRET is missing'
      );
		}

    const decodedToken = verifyToken(token, process.env.JWT_SECRET);

    if (!decodedToken) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Invalid token');
    }

    return new StepResponse({
      authIdentityId: decodedToken.authIdentityId,
      email: decodedToken.email,
    });
  }
);

export default verifyEmailVerificationTokenStep;
