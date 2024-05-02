export default async function () {
	const adminImport = (await import('@medusajs/medusa/dist/api/routes/store/carts/index')) as any;

	adminImport.defaultStoreCartRelations = [
		...adminImport.defaultStoreCartRelations,
		'items.variant.product.shipping_options',
	];
}
