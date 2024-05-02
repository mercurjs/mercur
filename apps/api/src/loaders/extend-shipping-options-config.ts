export default async function () {
	const adminImport = (await import('@medusajs/medusa/dist/api/routes/admin/shipping-options/index')) as any;

	adminImport.shippingOptionsDefaultFields = [...adminImport.shippingOptionsDefaultFields, 'store_id'];
}
