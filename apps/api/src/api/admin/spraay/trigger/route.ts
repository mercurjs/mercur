import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

import { assembleSpraayBatch } from '../../../../jobs/spraay-batch-aggregation';
import type { AdminSpraayTriggerResponse } from '../../../../modules/spraay-batch/types';

export async function POST(
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse<AdminSpraayTriggerResponse>,
): Promise<void> {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    logger.info(`[spraay-batch] Manual aggregation triggered by ${req.auth_context.actor_id}`);

    const result = await assembleSpraayBatch(req.scope);

    res.json(
        result.batch_id === null
            ? { batch_id: null, message: result.reason }
            : {
                  batch_id: result.batch_id,
                  message: `Assembled batch ${result.batch_id} with ${result.recipient_count} payouts`,
              },
    );
}
