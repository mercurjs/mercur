export const adminCors = {
	origin: process.env.ADMIN_CORS.split(','),
	credentials: true,
};

export const storeCors = {
	origin: process.env.STORE_CORS.split(','),
	credentials: true,
};
