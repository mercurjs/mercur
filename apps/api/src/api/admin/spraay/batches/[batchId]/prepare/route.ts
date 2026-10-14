import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import type { Knex } from '@medusajs/framework/mikro-orm/knex';
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils';
import { computeProtocolFee, sameAddress } from '@mercurjs/payout-spraay/amounts';
import { decodeSprayTokenCalldata, diffSprayTokenCalldata } from '@mercurjs/payout-spraay/chain/calldata';
import {
    BASE_CHAIN_ID,
    LOCAL_GAS_ESTIMATE_PADDING_PERCENT,
    SPRAAY_BATCH_CONTRACT_BASE,
} from '@mercurjs/payout-spraay/chain/constants';
import { SpraayGatewayClient, SpraayGatewayError } from '@mercurjs/payout-spraay/gateway/spraay-gateway.client';

import { SPRAAY_BATCH_MODULE } from '../../../../../../modules/spraay-batch';
import { transitionBatch } from '../../../../../../modules/spraay-batch/db';
import { SpraayBatchStatus } from '../../../../../../modules/spraay-batch/models';
import { getChainReader, getGatewayBaseUrl, getTreasuryAddress } from '../../../../../../modules/spraay-batch/runtime';
import type SpraayBatchModuleService from '../../../../../../modules/spraay-batch/service';
import type { AdminSpraayPrepareResponse } from '../../../../../../modules/spraay-batch/types';

export async function POST(
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse<AdminSpraayPrepareResponse>,
): Promise<void> {
    const spraayBatchService: SpraayBatchModuleService = req.scope.resolve(SPRAAY_BATCH_MODULE);
    const db: Knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    const { batchId } = req.params;

    const batch = await spraayBatchService.retrieveSpraayBatch(batchId, { relations: ['items'] });

    if (batch.status !== SpraayBatchStatus.ASSEMBLING) {
        throw new MedusaError(
            MedusaError.Types.CONFLICT,
            `Batch ${batchId} is in status "${batch.status}", expected "${SpraayBatchStatus.ASSEMBLING}"`,
        );
    }

    const treasury = getTreasuryAddress();
    if (!sameAddress(batch.treasury_address, treasury)) {
        throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            `Batch ${batchId} was assembled for treasury ${batch.treasury_address}, but the configured treasury is ${treasury}. Cancel it and re-run aggregation.`,
        );
    }

    const reader = getChainReader();
    const items = [...batch.items]
        .filter(item => !item.released_at)
        .sort((a, b) => (a.payout_id < b.payout_id ? -1 : 1))
        .map(item => ({ recipient: item.wallet_address, amount: BigInt(item.amount) }));

    const gateway = new SpraayGatewayClient({ baseUrl: getGatewayBaseUrl() });
    const gatewayRequest = {
        recipients: items.map(i => i.recipient),
        amounts: items.map(i => i.amount.toString()),
        sender: treasury,
    };
    const gatewayResponse = await gateway.execute(gatewayRequest).catch((error: unknown) => {
        // Medusa masks plain errors as "unknown"; operators need to see the gateway's reason (e.g. 402).
        if (error instanceof SpraayGatewayError) {
            throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, error.message);
        }
        throw error;
    });
    const tx = gatewayResponse.transaction;

    // The gateway is a third party: everything the operator will sign is checked
    // against our own batch items before it is stored as the signing request.
    const problems: string[] = [];
    if (!tx?.to || !tx.data) {
        problems.push('gateway did not return a transaction');
    } else {
        if (!sameAddress(tx.to, SPRAAY_BATCH_CONTRACT_BASE)) {
            problems.push(`transaction targets ${tx.to}, expected Spraay batch contract ${SPRAAY_BATCH_CONTRACT_BASE}`);
        }
        if (tx.chainId !== undefined && Number(tx.chainId) !== BASE_CHAIN_ID) {
            problems.push(`transaction chainId ${tx.chainId}, expected ${BASE_CHAIN_ID}`);
        }
        if (tx.value !== undefined && BigInt(tx.value) !== 0n) {
            problems.push(`transaction carries value ${tx.value}, expected 0`);
        }
        problems.push(...diffSprayTokenCalldata(decodeSprayTokenCalldata(tx.data), items));
    }
    if (problems.length || !tx?.to || !tx.data) {
        logger.error(`[spraay-batch] Gateway transaction for batch ${batchId} rejected: ${problems.join('; ')}`);
        throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            `Spraay gateway returned a transaction that does not match batch ${batchId}: ${problems.join('; ')}`,
        );
    }

    const [nonce, feeBps, preparedBlock] = await Promise.all([
        reader.getTransactionCount(treasury, 'pending'),
        reader.getFeeBps(),
        reader.getBlockNumber(),
    ]);
    const gas = tx.gasLimit
        ? BigInt(tx.gasLimit)
        : ((await reader.estimateGas({ from: treasury, to: tx.to, data: tx.data })) *
              BigInt(LOCAL_GAS_ESTIMATE_PADDING_PERCENT)) /
          100n;
    const feeAmount = computeProtocolFee(BigInt(batch.total_amount), feeBps);

    const moved = await transitionBatch(db, batchId, [SpraayBatchStatus.ASSEMBLING], SpraayBatchStatus.AWAITING_SIGNATURE, {
        unsigned_tx_to: tx.to,
        unsigned_tx_data: tx.data,
        unsigned_tx_value: '0',
        unsigned_tx_chain_id: BASE_CHAIN_ID,
        unsigned_tx_nonce: nonce,
        unsigned_tx_gas: gas.toString(),
        prepared_block_number: preparedBlock.toString(),
        fee_amount: feeAmount.toString(),
        gateway_request: JSON.stringify(gatewayRequest),
        gateway_response: JSON.stringify(gatewayResponse),
    });
    if (!moved) {
        throw new MedusaError(MedusaError.Types.CONFLICT, `Batch ${batchId} changed status while it was being prepared`);
    }

    logger.info(`[spraay-batch] Batch ${batchId} prepared: nonce ${nonce}, gas ${gas}, target ${tx.to}`);

    res.json({
        batch_id: batchId,
        status: SpraayBatchStatus.AWAITING_SIGNATURE,
        unsigned_transaction: {
            to: tx.to,
            data: tx.data,
            value: '0',
            chainId: BASE_CHAIN_ID,
            nonce,
            gas: gas.toString(),
        },
        approval_required: gatewayResponse.approvalRequired ?? null,
    });
}
