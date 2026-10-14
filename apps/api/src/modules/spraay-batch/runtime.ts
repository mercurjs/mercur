import { normalizeAddress } from '@mercurjs/payout-spraay/amounts';
import { ViemChainReader } from '@mercurjs/payout-spraay/chain/chain-reader';
import { DEFAULT_GATEWAY_URL, DEFAULT_LOG_SCAN_CHUNK_SIZE } from '@mercurjs/payout-spraay/chain/constants';

export function getTreasuryAddress(): `0x${string}` {
    const configured = process.env.SPRAAY_TREASURY_ADDRESS;
    if (!configured) {
        throw new Error('SPRAAY_TREASURY_ADDRESS is not configured');
    }
    return normalizeAddress(configured, 'SPRAAY_TREASURY_ADDRESS');
}

export function getChainReader(): ViemChainReader {
    const rpcUrl = process.env.SPRAAY_RPC_URL;
    if (!rpcUrl) {
        throw new Error('SPRAAY_RPC_URL is not configured');
    }
    return new ViemChainReader(rpcUrl, BigInt(DEFAULT_LOG_SCAN_CHUNK_SIZE));
}

export function getGatewayBaseUrl(): string {
    return process.env.SPRAAY_GATEWAY_URL || DEFAULT_GATEWAY_URL;
}
