import { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import StoreService from '../../../../../services/store';

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
	const { id } = req.params;

	const storeService: StoreService = req.scope.resolve('storeService');
	const data = await storeService.retrieveById(id);

	res.status(200).json({ store: data });
};
