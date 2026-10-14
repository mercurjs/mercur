import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import type { Knex } from '@medusajs/framework/mikro-orm/knex';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { computeProtocolFee, formatUsdc } from '@mercurjs/payout-spraay/amounts';
import { BASE_CHAIN_ID } from '@mercurjs/payout-spraay/chain/constants';

import { SpraayBatchStatus } from '../../../../modules/spraay-batch/models';
import { getChainReader, getTreasuryAddress } from '../../../../modules/spraay-batch/runtime';
import type { AdminSpraayPreflightResponse } from '../../../../modules/spraay-batch/types';

export async function GET(
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse<AdminSpraayPreflightResponse>,
): Promise<void> {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    const db: Knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

    let treasury: `0x${string}`;
    let reader: ReturnType<typeof getChainReader>;
    try {
        treasury = getTreasuryAddress();
        reader = getChainReader();
    } catch (error) {
        res.json({
            ready: false,
            checks: { rpc: false },
            problems: [error instanceof Error ? error.message : String(error)],
        });
        return;
    }

    try {
        const [chainId, blockNumber, usdcBalance, usdcAllowance, ethBalance, feeBps, paused, open] = await Promise.all([
            reader.getChainId(),
            reader.getBlockNumber(),
            reader.getUsdcBalance(treasury),
            reader.getUsdcAllowance(treasury),
            reader.getEthBalance(treasury),
            reader.getFeeBps(),
            reader.isPaused(),
            db('spraay_batch')
                .whereIn('status', [SpraayBatchStatus.ASSEMBLING, SpraayBatchStatus.AWAITING_SIGNATURE])
                .whereNull('deleted_at')
                .select('total_amount'),
        ]);

        const pendingTotal = open.reduce((sum: bigint, row: { total_amount: string }) => sum + BigInt(row.total_amount), 0n);
        const required = pendingTotal + computeProtocolFee(pendingTotal, feeBps);

        const problems: string[] = [];
        if (chainId !== BASE_CHAIN_ID) {
            problems.push(`RPC is on chain ${chainId}, expected Base (${BASE_CHAIN_ID})`);
        }
        if (paused) {
            problems.push('Spraay batch contract is paused');
        }
        if (ethBalance === 0n) {
            problems.push('Treasury has no ETH for gas');
        }
        if (usdcBalance < required) {
            problems.push(`Treasury USDC balance ${formatUsdc(usdcBalance)} is below the ${formatUsdc(required)} needed for open batches`);
        }
        if (usdcAllowance < required) {
            problems.push(`USDC allowance ${formatUsdc(usdcAllowance)} for the Spraay contract is below ${formatUsdc(required)}`);
        }

        res.json({
            ready: problems.length === 0,
            checks: {
                rpc: true,
                chain_id: chainId,
                block_number: blockNumber.toString(),
                contract_paused: paused,
                treasury_address: treasury,
                usdc_balance: formatUsdc(usdcBalance),
                usdc_balance_raw: usdcBalance.toString(),
                usdc_allowance: formatUsdc(usdcAllowance),
                usdc_allowance_raw: usdcAllowance.toString(),
                eth_balance_raw: ethBalance.toString(),
                fee_bps: feeBps.toString(),
                required_usdc_raw: required.toString(),
            },
            problems,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[spraay-preflight] ${message}`);
        res.json({ ready: false, checks: { rpc: false, treasury_address: treasury }, problems: [message] });
    }
}
