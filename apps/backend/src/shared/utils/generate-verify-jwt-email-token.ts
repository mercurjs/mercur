import jwt from 'jsonwebtoken';

export const generateEmailVerificationJwtToken = async (
	input: { email: string; authIdentityId: string },
	secret: string
): Promise<string> => {
	return jwt.sign(
		{
			email: input.email,
			authIdentityId: input.authIdentityId,
			expiresAt: Date.now() + 24 * 60 * 60 * 1000,
		},
		secret,
		{ expiresIn: '24h' }
	);
};