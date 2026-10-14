import type { Knex } from '@medusajs/framework/mikro-orm/knex';

import { SpraayBatchStatus } from './models';

export type SpraayDb = Knex | Knex.Transaction;

/**
 * Compare-and-set on batch status. Returns false when another request moved the
 * batch first, so callers never act on a status they only read earlier.
 */
export async function transitionBatch(
    db: SpraayDb,
    batchId: string,
    from: SpraayBatchStatus[],
    to: SpraayBatchStatus,
    fields: Record<string, string | number | boolean | Date | null> = {},
): Promise<boolean> {
    const result = await db('spraay_batch')
        .where('id', batchId)
        .whereIn('status', from)
        .whereNull('deleted_at')
        .update({ ...fields, status: to, updated_at: db.fn.now() })
        .returning('id');
    return result.length > 0;
}

export async function releasePayoutsFromBatch(db: SpraayDb, batchId: string): Promise<void> {
    await db.raw(
        `UPDATE "payout"
         SET "data" = jsonb_set(COALESCE("data", '{}'::jsonb), '{batch_id}', 'null'::jsonb),
             "updated_at" = NOW()
         WHERE "data"->>'batch_id' = ?
           AND "status" = 'pending'
           AND "deleted_at" IS NULL`,
        [batchId],
    );
    await db.raw(
        `UPDATE "spraay_batch_item"
         SET "released_at" = NOW(), "updated_at" = NOW()
         WHERE "batch_id" = ?
           AND "released_at" IS NULL
           AND "deleted_at" IS NULL`,
        [batchId],
    );
}
