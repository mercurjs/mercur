import { MiddlewareRoute } from '@medusajs/medusa';
import { requireAdmin } from '../middlewares/require-admin';

/**
 * Middleware routes that are restricted to vendor users
 */
export const restrictedAdminMiddlewares = [
	{
		matcher: '/admin/apps*',
	},
	{ matcher: '/admin/batch-jobs*' },
	{
		matcher: '/admin/currencies/*',
		method: ['POST'],
	},
	{
		matcher: '/admin/customer-groups*',
	},
	{
		matcher: '/admin/customers*',
	},
	{
		matcher: '/admin/discounts*',
	},
	{ matcher: '/admin/draft-orders*' },
	{
		matcher: '/admin/gift-cards*',
	},
	{
		matcher: '/admin/inventory-items*',
	},
	{
		matcher: '/admin/notifications*',
	},
	{
		matcher: '/admin/order-edits*',
	},
	{
		matcher: '/admin/payment-collections*',
	},
	{
		matcher: '/admin/payments*',
	},
	{
		matcher: '/admin/price-lists*',
	},
	{
		matcher: '/admin/product-categories*',
		method: ['POST', 'DELETE'],
	},
	{
		matcher: '/admin/collections*',
	},
	{
		matcher: '/admin/publishable-api-keys*',
	},
	{
		matcher: '/admin/regions*',
		method: ['POST', 'DELETE'],
	},
	{
		matcher: '/admin/reservations*',
	},
	{
		matcher: '/admin/return-reasons*',
	},
	{
		matcher: '/admin/returns*',
	},
	{
		matcher: '/admin/sales-channels*',
		method: ['POST', 'DELETE'],
	},
	{
		matcher: '/admin/shipping-profiles*',
	},
	{
		matcher: '/admin/stock-locations*',
	},
	{
		matcher: '/admin/swap*',
	},
	{
		matcher: '/admin/tax-rates*',
		method: ['POST', 'DELETE'],
	},
	{
		matcher: '/admin/uploads',
		method: ['DELETE'],
	},
	{
		matcher: '/admin/users/*',
		method: ['DELETE'],
	},
	{
		matcher: '/admin/users',
		method: ['POST'],
	},
	{
		matcher: '/admin/store/currencies/*',
	},
	{
		matcher: '/admin/store/details/*',
	},
	{
		matcher: '/admin/store/payment-providers',
	},
	{
		matcher: '/admin/store/tax-providers',
	},
].map((config) => ({
	...config,
	middlewares: [requireAdmin()],
})) as MiddlewareRoute[];
