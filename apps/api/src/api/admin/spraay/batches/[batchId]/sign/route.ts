import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import type { Knex } from '@medusajs/framework/mikro-orm/knex';
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils';
import { sameAddress } from '@mercurjs/payout-spraay/amounts';
import { inspectSignedTransaction } from '@mercurjs/payout-spraay/chain/signed-transaction';

import { SPRAAY_BATCH_MODULE } from '../../../../../../modules/spraay-batch';
import { transitionBatch } from '../../../../../../modules/spraay-batch/db';
import { SpraayBatchStatus } from '../../../../../../modules/spraay-batch/models';
import { getChainReader, getTreasuryAddress } from '../../../../../../modules/spraay-batch/runtime';
import type SpraayBatchModuleService from '../../../../../../modules/spraay-batch/service';
import type { AdminSpraaySignResponse } from '../../../../../../modules/spraay-batch/types';
import type { AdminSignSpraayBatchType } from '../../../validators';

const ALREADY_KNOWN = /already known|known transaction/i;

export async function POST(
    req: AuthenticatedMedusaRequest<AdminSignSpraayBatchType>,
    res: MedusaResponse<AdminSpraaySignResponse>,
): Promise<void> {
    const spraayBatchService: SpraayBatchModuleService = req.scope.resolve(SPRAAY_BATCH_MODULE);
    const db: Knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    const { batchId } = req.params;
    const { signed_transaction } = req.validatedBody;

    const batch = await spraayBatchService.retrieveSpraayBatch(batchId);

    if (batch.status !== SpraayBatchStatus.AWAITING_SIGNATURE) {
        throw new MedusaError(
            MedusaError.Types.CONFLICT,
            `Batch ${batchId} is in status "${batch.status}", expected "${SpraayBatchStatus.AWAITING_SIGNATURE}"`,
        );
    }
    if (batch.expires_at && new Date(batch.expires_at) < new Date()) {
        throw new MedusaError(MedusaError.Types.CONFLICT, `Batch ${batchId} signing window has expired`);
    }
    if (
        !batch.unsigned_tx_to ||
        !batch.unsigned_tx_data ||
        batch.unsigned_tx_chain_id === null ||
        batch.unsigned_tx_nonce === null
    ) {
        throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Batch ${batchId} has no prepared signing request`);
    }

    const treasury = getTreasuryAddress();
    if (!sameAddress(batch.treasury_address, treasury)) {
        throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            `Batch ${batchId} treasury ${batch.treasury_address} does not match the configured treasury ${treasury}`,
        );
    }

    const inspection = await inspectSignedTransaction(signed_transaction, {
        from: treasury,
        to: batch.unsigned_tx_to,
        data: batch.unsigned_tx_data,
        value: batch.unsigned_tx_value || '0',
        chainId: batch.unsigned_tx_chain_id,
        nonce: batch.unsigned_tx_nonce,
        gas: batch.unsigned_tx_gas || '0',
    });
    if (!inspection.ok) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Signed transaction does not match the approved signing request: ${inspection.problems.join('; ')}`,
        );
    }

    const reader = getChainReader();
    const txHash = inspection.tx.hash;

    // Persist the hash before broadcasting: if the process dies mid-send, the
    // reconciler can still find the transaction on chain instead of releasing
    // payouts that may already be paid.
    const claimed = await transitionBatch(
        db,
        batchId,
        [SpraayBatchStatus.AWAITING_SIGNATURE],
        SpraayBatchStatus.BROADCASTING,
        { signed_tx_raw: signed_transaction, tx_hash: txHash, signed_at: new Date() },
    );
    if (!claimed) {
        throw new MedusaError(MedusaError.Types.CONFLICT, `Batch ${batchId} was signed or changed by another request`);
    }

    try {
        const sentHash = await reader.sendRawTransaction(signed_transaction);
        if (sentHash.toLowerCase() !== txHash.toLowerCase()) {
            logger.warn(`[spraay-batch] RPC returned hash ${sentHash} for batch ${batchId}, expected ${txHash}`);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!ALREADY_KNOWN.test(message)) {
            // FAILED keeps the payouts attached to this batch: an RPC error does not
            // prove the transaction never propagated. The reconciler releases them
            // only once the pinned nonce is consumed without this transaction.
            await transitionBatch(db, batchId, [SpraayBatchStatus.BROADCASTING], SpraayBatchStatus.FAILED, {
                error_message: `Broadcast failed: ${message}`,
            });
            logger.error(`[spraay-batch] Broadcast failed for batch ${batchId} (tx ${txHash}): ${message}`);
            throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Failed to broadcast transaction: ${message}`);
        }
    }

    await transitionBatch(db, batchId, [SpraayBatchStatus.BROADCASTING], SpraayBatchStatus.CONFIRMING, {
        broadcast_at: new Date(),
    });

    logger.info(`[spraay-batch] Batch ${batchId} broadcast as tx ${txHash} by ${req.auth_context.actor_id}`);

    res.json({ batch_id: batchId, tx_hash: txHash, status: SpraayBatchStatus.CONFIRMING });
}
