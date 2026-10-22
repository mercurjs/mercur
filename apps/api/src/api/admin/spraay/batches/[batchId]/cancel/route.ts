import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import type { Knex } from '@medusajs/framework/mikro-orm/knex';
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils';

import { releasePayoutsFromBatch, transitionBatch } from '../../../../../../modules/spraay-batch/db';
import { SpraayBatchStatus } from '../../../../../../modules/spraay-batch/models';
import type { AdminSpraayCancelResponse } from '../../../../../../modules/spraay-batch/types';

export async function POST(
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse<AdminSpraayCancelResponse>,
): Promise<void> {
    const db: Knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);
    const { batchId } = req.params;
    const reason = `Canceled by ${req.auth_context.actor_id}`;

    const outcome = await db.transaction(async trx => {
        if (
            await transitionBatch(trx, batchId, [SpraayBatchStatus.ASSEMBLING], SpraayBatchStatus.CANCELED, {
                error_message: reason,
            })
        ) {
            await releasePayoutsFromBatch(trx, batchId);
            return 'released' as const;
        }
        // An unsigned transaction has already been handed out at a pinned nonce and
        // could still be signed elsewhere. The reconciler releases these payouts once
        // that nonce is consumed by something other than this batch.
        if (
            await transitionBatch(trx, batchId, [SpraayBatchStatus.AWAITING_SIGNATURE], SpraayBatchStatus.CANCELED, {
                error_message: `${reason}; payouts held until the pinned treasury nonce is used`,
            })
        ) {
            return 'held' as const;
        }
        return null;
    });

    if (!outcome) {
        throw new MedusaError(
            MedusaError.Types.CONFLICT,
            `Batch ${batchId} does not exist or can no longer be canceled (only assembling or awaiting_signature batches can be)`,
        );
    }

    res.json({ batch_id: batchId, status: SpraayBatchStatus.CANCELED, payouts_released: outcome === 'released' });
}
