import type { Knex } from '@medusajs/framework/mikro-orm/knex';
import { MedusaContainer } from '@medusajs/framework/types';
import { ContainerRegistrationKeys, generateEntityId } from '@medusajs/framework/utils';
import { normalizeAddress, parseUsdcDecimal } from '@mercurjs/payout-spraay/amounts';
import {
    DEFAULT_SIGNING_TIMEOUT_MS,
    MAX_RECIPIENTS_PER_BATCH,
    MIN_BATCH_SIZE,
} from '@mercurjs/payout-spraay/chain/constants';

import { SpraayBatchStatus } from '../modules/spraay-batch/models';
import { getTreasuryAddress } from '../modules/spraay-batch/runtime';

const ACTIVE_STATUSES = [
    SpraayBatchStatus.ASSEMBLING,
    SpraayBatchStatus.AWAITING_SIGNATURE,
    SpraayBatchStatus.BROADCASTING,
    SpraayBatchStatus.CONFIRMING,
];

export type SpraayAggregationResult =
    | { batch_id: string; recipient_count: number; total_amount: string }
    | { batch_id: null; reason: string };

type PendingPayoutRow = { id: string; amount: string; data: Record<string, unknown> | string | null };

export async function assembleSpraayBatch(container: MedusaContainer): Promise<SpraayAggregationResult> {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const db: Knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);
    const treasury = getTreasuryAddress();

    return db.transaction(async trx => {
        // Serializes aggregation across workers for the life of this transaction, so
        // two instances can't both pass the "no active batch" check.
        await trx.raw(`SELECT pg_advisory_xact_lock(hashtext('spraay-batch-aggregation'))`);

        const active = await trx('spraay_batch').whereIn('status', ACTIVE_STATUSES).whereNull('deleted_at').first('id');
        if (active) {
            return { batch_id: null, reason: `Batch ${active.id} is still in progress` };
        }

        const { rows } = await trx.raw<{ rows: PendingPayoutRow[] }>(
            `SELECT p."id", p."amount"::text AS "amount", p."data"
             FROM "payout" p
             WHERE p."status" = 'pending'
               AND p."deleted_at" IS NULL
               AND p."data"->>'provider' = 'spraay'
               AND p."data"->>'batch_id' IS NULL
               AND NOT EXISTS (
                   SELECT 1 FROM "spraay_batch_item" sbi
                   WHERE sbi."payout_id" = p."id"
                     AND sbi."released_at" IS NULL
                     AND sbi."deleted_at" IS NULL
               )
             ORDER BY p."created_at" ASC
             LIMIT ?
             FOR UPDATE OF p SKIP LOCKED`,
            [MAX_RECIPIENTS_PER_BATCH],
        );

        const items: Array<{ payout_id: string; wallet_address: string; amount: bigint }> = [];
        for (const row of rows) {
            const data = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data ?? {});
            try {
                items.push({
                    payout_id: row.id,
                    wallet_address: normalizeAddress(String(data.wallet_address), `payout ${row.id} wallet_address`),
                    amount: parseUsdcDecimal(row.amount, `payout ${row.id} amount`),
                });
            } catch (error) {
                logger.error(
                    `[spraay-batch] Skipping payout ${row.id}: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
        }

        if (items.length < MIN_BATCH_SIZE) {
            return {
                batch_id: null,
                reason: `${items.length} eligible payout(s), below the minimum batch size of ${MIN_BATCH_SIZE}`,
            };
        }

        const batchId = generateEntityId(undefined, 'spbat');
        const total = items.reduce((sum, item) => sum + item.amount, 0n);
        const now = new Date();

        await trx('spraay_batch').insert({
            id: batchId,
            status: SpraayBatchStatus.ASSEMBLING,
            treasury_address: treasury,
            total_amount: total.toString(),
            recipient_count: items.length,
            expires_at: new Date(now.getTime() + DEFAULT_SIGNING_TIMEOUT_MS),
            assembled_at: now,
        });
        await trx('spraay_batch_item').insert(
            items.map(item => ({
                id: generateEntityId(undefined, 'spitm'),
                batch_id: batchId,
                payout_id: item.payout_id,
                wallet_address: item.wallet_address,
                amount: item.amount.toString(),
                currency_code: 'usdc',
            })),
        );
        await trx.raw(
            `UPDATE "payout"
             SET "data" = jsonb_set(COALESCE("data", '{}'::jsonb), '{batch_id}', to_jsonb(?::text)),
                 "updated_at" = NOW()
             WHERE "id" = ANY(?)`,
            [batchId, items.map(item => item.payout_id)],
        );

        logger.info(`[spraay-batch] Assembled batch ${batchId}: ${items.length} payouts, ${total} USDC base units`);
        return { batch_id: batchId, recipient_count: items.length, total_amount: total.toString() };
    });
}

export default async function spraayBatchAggregation(container: MedusaContainer): Promise<void> {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    try {
        const result = await assembleSpraayBatch(container);
        if (result.batch_id === null) {
            logger.debug(`[spraay-batch] No batch assembled: ${result.reason}`);
        }
    } catch (error) {
        logger.error(`[spraay-batch] Aggregation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export const config = {
    name: 'spraay-batch-aggregation',
    schedule: '*/15 * * * *',
};
