import type { Knex } from '@medusajs/framework/mikro-orm/knex';
import { IWorkflowEngineService, Logger, MedusaContainer } from '@medusajs/framework/types';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import type { ViemChainReader } from '@mercurjs/payout-spraay/chain/chain-reader';
import { DEFAULT_REQUIRED_CONFIRMATIONS } from '@mercurjs/payout-spraay/chain/constants';
import { verifySettlement } from '@mercurjs/payout-spraay/chain/verify-settlement';
import type { ChainReceipt, ChainTransaction } from '@mercurjs/payout-spraay/chain/verify-settlement';

import { releasePayoutsFromBatch, transitionBatch } from '../modules/spraay-batch/db';
import { SpraayBatchStatus } from '../modules/spraay-batch/models';
import { getChainReader } from '../modules/spraay-batch/runtime';

const REQUIRED_CONFIRMATIONS = BigInt(DEFAULT_REQUIRED_CONFIRMATIONS);
const PROCESS_PAYOUT_FOR_WEBHOOK = 'process-payout-for-webhook';

type BatchRow = {
    id: string;
    status: SpraayBatchStatus;
    treasury_address: string;
    tx_hash: string | null;
    signed_tx_raw: string | null;
    unsigned_tx_nonce: number;
    prepared_block_number: string | null;
};

type ItemRow = { payout_id: string; wallet_address: string; amount: string };

type Context = {
    db: Knex;
    reader: ViemChainReader;
    wfEngine: IWorkflowEngineService;
    logger: Logger;
    head: bigint;
};

export default async function spraaySettlementReconciler(container: MedusaContainer): Promise<void> {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const db: Knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

    try {
        await expireUnsignedBatches(db, logger);

        const candidates = await unresolvedBatches(db);
        if (candidates.length === 0) {
            return;
        }

        const reader = getChainReader();
        const ctx: Context = {
            db,
            reader,
            wfEngine: container.resolve(Modules.WORKFLOW_ENGINE),
            logger,
            head: await reader.getBlockNumber(),
        };

        for (const batch of candidates) {
            try {
                await resolveBatch(ctx, batch);
            } catch (error) {
                logger.error(
                    `[spraay-reconciler] Failed to reconcile batch ${batch.id}: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
        }
    } catch (error) {
        logger.error(`[spraay-reconciler] Reconciliation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function expireUnsignedBatches(db: Knex, logger: Logger): Promise<void> {
    const expired: Array<{ id: string; status: SpraayBatchStatus }> = await db('spraay_batch')
        .whereIn('status', [SpraayBatchStatus.ASSEMBLING, SpraayBatchStatus.AWAITING_SIGNATURE])
        .whereNull('deleted_at')
        .where('expires_at', '<', db.fn.now())
        .select('id', 'status');

    for (const row of expired) {
        await db.transaction(async trx => {
            if (!(await transitionBatch(trx, row.id, [row.status], SpraayBatchStatus.EXPIRED, {
                error_message: 'Signing window expired',
            }))) {
                return;
            }
            if (row.status === SpraayBatchStatus.ASSEMBLING) {
                await releasePayoutsFromBatch(trx, row.id);
                logger.info(`[spraay-reconciler] Expired batch ${row.id} and released its payouts`);
            } else {
                logger.info(`[spraay-reconciler] Expired batch ${row.id}; payouts held until its pinned nonce is used`);
            }
        });
    }
}

/**
 * Every batch that had a nonce pinned, has not settled, and still holds payouts.
 * Includes failed/expired/canceled ones: their transaction may still execute.
 */
async function unresolvedBatches(db: Knex): Promise<BatchRow[]> {
    const { rows } = await db.raw<{ rows: BatchRow[] }>(
        `SELECT b."id", b."status", b."treasury_address", b."tx_hash", b."signed_tx_raw",
                b."unsigned_tx_nonce", b."prepared_block_number"
         FROM "spraay_batch" b
         WHERE b."deleted_at" IS NULL
           AND b."unsigned_tx_nonce" IS NOT NULL
           AND b."settled_at" IS NULL
           AND b."block_number" IS NULL
           AND b."status" IN (?, ?, ?, ?, ?)
           AND EXISTS (
               SELECT 1 FROM "spraay_batch_item" i
               WHERE i."batch_id" = b."id" AND i."released_at" IS NULL AND i."deleted_at" IS NULL
           )
         ORDER BY b."created_at" ASC`,
        [
            SpraayBatchStatus.BROADCASTING,
            SpraayBatchStatus.CONFIRMING,
            SpraayBatchStatus.FAILED,
            SpraayBatchStatus.EXPIRED,
            SpraayBatchStatus.CANCELED,
        ],
    );
    return rows;
}

async function resolveBatch(ctx: Context, batch: BatchRow): Promise<void> {
    const { reader, logger } = ctx;

    if (batch.tx_hash) {
        const receipt = await reader.getTransactionReceipt(batch.tx_hash);
        if (receipt) {
            await finalizeIfDeep(ctx, batch, batch.tx_hash, receipt);
            return;
        }
    }

    const latestNonce = await reader.getTransactionCount(batch.treasury_address, 'latest');
    if (latestNonce <= batch.unsigned_tx_nonce) {
        await keepAlive(ctx, batch);
        return;
    }

    // The pinned nonce is used, but not by the transaction we recorded. Wait until
    // that is final, then look for a Spraay execution at this nonce (a wallet
    // "speed up" re-signs the same call under a new hash) before giving up on it.
    const safeBlock = ctx.head - REQUIRED_CONFIRMATIONS + 1n;
    const safeNonce = await reader.getTransactionCount(batch.treasury_address, safeBlock);
    if (safeNonce <= batch.unsigned_tx_nonce) {
        logger.info(`[spraay-reconciler] Batch ${batch.id}: nonce ${batch.unsigned_tx_nonce} used, waiting for finality`);
        return;
    }

    if (!batch.prepared_block_number) {
        logger.error(`[spraay-reconciler] Batch ${batch.id} has no prepared block to scan from; resolve it manually`);
        return;
    }

    const executions = await reader.findSprayTokenExecutions(
        batch.treasury_address,
        BigInt(batch.prepared_block_number),
        safeBlock,
    );
    for (const execution of executions) {
        const tx = await reader.getTransaction(execution.transactionHash);
        if (tx?.nonce !== batch.unsigned_tx_nonce) {
            continue;
        }
        const receipt = await reader.getTransactionReceipt(execution.transactionHash);
        if (receipt) {
            await finalize(ctx, batch, tx, receipt);
            return;
        }
    }

    const neverSent = batch.status === SpraayBatchStatus.CANCELED || batch.status === SpraayBatchStatus.EXPIRED;
    await ctx.db.transaction(async trx => {
        if (await transitionBatch(trx, batch.id, [batch.status], neverSent ? batch.status : SpraayBatchStatus.FAILED, {
            error_message: `Treasury nonce ${batch.unsigned_tx_nonce} was used by a non-Spraay transaction; this batch can no longer execute`,
        })) {
            await releasePayoutsFromBatch(trx, batch.id);
        }
    });
    logger.warn(`[spraay-reconciler] Batch ${batch.id}: nonce consumed elsewhere, payouts released for rebatching`);
}

async function keepAlive(ctx: Context, batch: BatchRow): Promise<void> {
    if (!batch.signed_tx_raw || !batch.tx_hash) {
        return;
    }
    const recovering = batch.status === SpraayBatchStatus.BROADCASTING;
    const dropped =
        batch.status === SpraayBatchStatus.CONFIRMING && !(await ctx.reader.getTransaction(batch.tx_hash));
    if (!recovering && !dropped) {
        return;
    }
    try {
        await ctx.reader.sendRawTransaction(batch.signed_tx_raw);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/already known|known transaction/i.test(message)) {
            ctx.logger.warn(`[spraay-reconciler] Re-broadcast of batch ${batch.id} failed: ${message}`);
            return;
        }
    }
    if (recovering) {
        await transitionBatch(ctx.db, batch.id, [SpraayBatchStatus.BROADCASTING], SpraayBatchStatus.CONFIRMING, {
            broadcast_at: new Date(),
        });
    }
    ctx.logger.info(`[spraay-reconciler] Re-broadcast batch ${batch.id} (tx ${batch.tx_hash})`);
}

async function finalizeIfDeep(ctx: Context, batch: BatchRow, txHash: string, receipt: ChainReceipt): Promise<void> {
    const tx = await ctx.reader.getTransaction(txHash);
    if (!tx) {
        return;
    }
    await finalize(ctx, batch, tx, receipt);
}

async function finalize(ctx: Context, batch: BatchRow, tx: ChainTransaction, receipt: ChainReceipt): Promise<void> {
    const { db, logger, wfEngine } = ctx;
    const confirmations = ctx.head - receipt.blockNumber + 1n;
    if (confirmations < REQUIRED_CONFIRMATIONS) {
        logger.info(
            `[spraay-reconciler] Batch ${batch.id} tx ${tx.hash}: ${confirmations}/${REQUIRED_CONFIRMATIONS} confirmations`,
        );
        return;
    }

    const items: ItemRow[] = await db('spraay_batch_item')
        .where('batch_id', batch.id)
        .whereNull('released_at')
        .whereNull('deleted_at')
        .orderByRaw('"payout_id" COLLATE "C" ASC')
        .select('payout_id', 'wallet_address', 'amount');

    const verification = verifySettlement({
        tx,
        receipt,
        sender: batch.treasury_address,
        items: items.map(item => ({ recipient: item.wallet_address, amount: BigInt(item.amount) })),
    });

    if (!verification.ok) {
        await db.transaction(async trx => {
            const moved = await transitionBatch(trx, batch.id, [batch.status], SpraayBatchStatus.FAILED, {
                tx_hash: tx.hash,
                block_number: receipt.blockNumber.toString(),
                error_message: `Settlement verification failed: ${verification.problems.join('; ')}`,
            });
            // A revert consumed the nonce without moving funds, so these payouts are
            // safe to rebatch. A mismatch moved funds we can't account for: hold them.
            if (moved && verification.kind === 'reverted') {
                await releasePayoutsFromBatch(trx, batch.id);
            }
        });
        if (verification.kind === 'reverted') {
            logger.warn(`[spraay-reconciler] Batch ${batch.id} reverted in ${tx.hash}; payouts released for rebatching`);
        } else {
            logger.error(
                `[spraay-reconciler] Batch ${batch.id} tx ${tx.hash} does not match its items, payouts held: ${verification.problems.join('; ')}`,
            );
        }
        return;
    }

    const settledAt = new Date();
    await db.raw(
        `UPDATE "payout"
         SET "data" = COALESCE("data", '{}'::jsonb) || jsonb_build_object(
                 'tx_hash', ?::text, 'block_number', ?::text, 'settled_at', ?::text),
             "updated_at" = NOW()
         WHERE "id" = ANY(?)`,
        [tx.hash, verification.blockNumber.toString(), settledAt.toISOString(), items.map(item => item.payout_id)],
    );

    // Payouts are marked PAID before the batch flips to SETTLED: if this run dies
    // half way, the batch is picked up again and the workflow is safe to repeat.
    for (const item of items) {
        await wfEngine.run(PROCESS_PAYOUT_FOR_WEBHOOK, {
            input: { action: 'payout.paid', data: { id: item.payout_id } },
            throwOnError: true,
        });
    }

    await transitionBatch(db, batch.id, [batch.status], SpraayBatchStatus.SETTLED, {
        tx_hash: tx.hash,
        block_number: verification.blockNumber.toString(),
        settled_fee_amount: verification.feeAmount.toString(),
        settled_at: settledAt,
    });

    logger.info(
        `[spraay-reconciler] Batch ${batch.id} settled in ${tx.hash} at block ${verification.blockNumber}; ${items.length} payouts PAID`,
    );
}

export const config = {
    name: 'spraay-settlement-reconciler',
    schedule: '*/5 * * * *',
};
