import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http';

import { SPRAAY_BATCH_MODULE } from '../../../../../modules/spraay-batch';
import type SpraayBatchModuleService from '../../../../../modules/spraay-batch/service';
import type { AdminSpraayBatchResponse, SpraayBatchDTO } from '../../../../../modules/spraay-batch/types';

export async function GET(
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse<AdminSpraayBatchResponse>,
): Promise<void> {
    const spraayBatchService: SpraayBatchModuleService = req.scope.resolve(SPRAAY_BATCH_MODULE);

    const batch = await spraayBatchService.retrieveSpraayBatch(req.params.batchId, {
        relations: ['items'],
    });

    res.json({ batch: batch as SpraayBatchDTO });
}
