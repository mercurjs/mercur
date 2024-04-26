export default async function () {
	const storeImport = (await import('@medusajs/medusa/dist/api/routes/store/products/index')) as any;

	storeImport.allowedStoreProductsFields = [...storeImport.allowedStoreProductsFields, 'store_id'];
	storeImport.defaultStoreProductsFields = [...storeImport.defaultStoreProductsFields, 'store_id'];

	storeImport.defaultStoreProductsRelations = [...storeImport.defaultStoreProductsRelations, 'shipping_options'];

	storeImport.allowedStoreProductsRelations = [...storeImport.allowedStoreProductsRelations, 'shipping_options'];

	const adminImport = (await import('@medusajs/medusa/dist/api/routes/admin/products/index')) as any;

	adminImport.defaultAdminProductFields = [...adminImport.defaultAdminProductFields, 'store_id'];

	adminImport.defaultAdminProductRelations = [...adminImport.defaultAdminProductRelations, 'shipping_options'];
}
