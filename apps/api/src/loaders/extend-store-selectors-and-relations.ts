export default async function () {
	const adminImport = (await import('@medusajs/medusa/dist/api/routes/admin/store/index')) as any;

	adminImport.defaultRelationsExtended = [...adminImport.defaultRelationsExtended, 'shipping_options'];
}
