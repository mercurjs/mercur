import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http';

import { SPRAAY_BATCH_MODULE } from '../../../../modules/spraay-batch';
import type SpraayBatchModuleService from '../../../../modules/spraay-batch/service';
import type { AdminSpraayBatchListResponse, SpraayBatchDTO } from '../../../../modules/spraay-batch/types';
import type { AdminGetSpraayBatchesParamsType } from '../validators';

export async function GET(
    req: AuthenticatedMedusaRequest<unknown, AdminGetSpraayBatchesParamsType>,
    res: MedusaResponse<AdminSpraayBatchListResponse>,
): Promise<void> {
    const spraayBatchService: SpraayBatchModuleService = req.scope.resolve(SPRAAY_BATCH_MODULE);
    const { status, limit, offset } = req.validatedQuery as AdminGetSpraayBatchesParamsType;

    const [batches, count] = await spraayBatchService.listAndCountSpraayBatches(status ? { status } : {}, {
        take: limit,
        skip: offset,
        order: { created_at: 'DESC' },
        relations: ['items'],
    });

    res.json({
        batches: batches as SpraayBatchDTO[],
        count,
        limit,
        offset,
    });
}
