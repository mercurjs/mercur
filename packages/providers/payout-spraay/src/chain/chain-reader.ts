import { createPublicClient, getAbiItem, Hex, http, PublicClient } from 'viem';
import { base } from 'viem/chains';

import { BASE_CHAIN_ID, SPRAAY_BATCH_CONTRACT_BASE, USDC_BASE } from './constants';

import { erc20Abi, spraayBatchAbi } from './abi';
import { ChainReceipt, ChainTransaction } from './verify-settlement';

export interface SprayEventRef {
    transactionHash: `0x${string}`;
    blockNumber: bigint;
}

export interface SpraayChainReader {
    getChainId(): Promise<number>;
    getBlockNumber(): Promise<bigint>;
    getTransactionCount(address: string, at: 'latest' | 'pending' | bigint): Promise<number>;
    getFeeBps(): Promise<bigint>;
    isPaused(): Promise<boolean>;
    getEthBalance(owner: string): Promise<bigint>;
    getUsdcBalance(owner: string): Promise<bigint>;
    getUsdcAllowance(owner: string): Promise<bigint>;
    getCode(address: string): Promise<string | undefined>;
    simulate(call: { from: string; to: string; data: string }): Promise<string | undefined>;
    estimateGas(call: { from: string; to: string; data: string }): Promise<bigint>;
    getTransaction(hash: string): Promise<ChainTransaction | null>;
    getTransactionReceipt(hash: string): Promise<ChainReceipt | null>;
    sendRawTransaction(raw: string): Promise<string>;
    findSprayTokenExecutions(sender: string, fromBlock: bigint, toBlock: bigint): Promise<SprayEventRef[]>;
}

export class ViemChainReader implements SpraayChainReader {
    private readonly client: PublicClient;

    constructor(
        rpcUrl: string,
        private readonly logScanChunkSize: bigint,
    ) {
        this.client = createPublicClient({ chain: base, transport: http(rpcUrl, { retryCount: 2 }) }) as PublicClient;
    }

    getChainId() {
        return this.client.getChainId();
    }

    getBlockNumber() {
        return this.client.getBlockNumber({ cacheTime: 0 });
    }

    getTransactionCount(address: string, at: 'latest' | 'pending' | bigint) {
        return typeof at === 'bigint'
            ? this.client.getTransactionCount({ address: address as Hex, blockNumber: at })
            : this.client.getTransactionCount({ address: address as Hex, blockTag: at });
    }

    getEthBalance(owner: string) {
        return this.client.getBalance({ address: owner as Hex });
    }

    getFeeBps() {
        return this.client.readContract({
            address: SPRAAY_BATCH_CONTRACT_BASE,
            abi: spraayBatchAbi,
            functionName: 'feeBps',
        });
    }

    isPaused() {
        return this.client.readContract({
            address: SPRAAY_BATCH_CONTRACT_BASE,
            abi: spraayBatchAbi,
            functionName: 'paused',
        });
    }

    getUsdcBalance(owner: string) {
        return this.client.readContract({
            address: USDC_BASE,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [owner as Hex],
        });
    }

    getUsdcAllowance(owner: string) {
        return this.client.readContract({
            address: USDC_BASE,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [owner as Hex, SPRAAY_BATCH_CONTRACT_BASE],
        });
    }

    getCode(address: string) {
        return this.client.getCode({ address: address as Hex });
    }

    async simulate(call: { from: string; to: string; data: string }) {
        try {
            await this.client.call({ account: call.from as Hex, to: call.to as Hex, data: call.data as Hex });
            return undefined;
        } catch (e: unknown) {
            if (e instanceof Error) {
                return (e as { shortMessage?: string }).shortMessage ?? e.message;
            }
            return String(e);
        }
    }

    estimateGas(call: { from: string; to: string; data: string }) {
        return this.client.estimateGas({ account: call.from as Hex, to: call.to as Hex, data: call.data as Hex });
    }

    async getTransaction(hash: string): Promise<ChainTransaction | null> {
        try {
            const tx = await this.client.getTransaction({ hash: hash as Hex });
            return {
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                input: tx.input,
                value: tx.value,
                nonce: tx.nonce,
                chainId: tx.chainId ?? null,
                blockNumber: tx.blockNumber,
            };
        } catch (e: unknown) {
            if (e instanceof Error && e.name === 'TransactionNotFoundError') {
                return null;
            }
            throw e;
        }
    }

    async getTransactionReceipt(hash: string): Promise<ChainReceipt | null> {
        try {
            const receipt = await this.client.getTransactionReceipt({ hash: hash as Hex });
            return {
                transactionHash: receipt.transactionHash,
                status: receipt.status,
                blockNumber: receipt.blockNumber,
                from: receipt.from,
                to: receipt.to,
                logs: receipt.logs.map(log => ({
                    address: log.address,
                    topics: log.topics,
                    data: log.data,
                    logIndex: log.logIndex,
                })),
            };
        } catch (e: unknown) {
            if (e instanceof Error && e.name === 'TransactionReceiptNotFoundError') {
                return null;
            }
            throw e;
        }
    }

    sendRawTransaction(raw: string) {
        return this.client.sendRawTransaction({ serializedTransaction: raw as Hex });
    }

    async findSprayTokenExecutions(sender: string, fromBlock: bigint, toBlock: bigint): Promise<SprayEventRef[]> {
        const found: SprayEventRef[] = [];
        const event = getAbiItem({ abi: spraayBatchAbi, name: 'SprayTokenExecuted' });
        for (let start = fromBlock; start <= toBlock; start += this.logScanChunkSize) {
            const end = start + this.logScanChunkSize - 1n < toBlock ? start + this.logScanChunkSize - 1n : toBlock;
            const logs = await this.client.getLogs({
                address: SPRAAY_BATCH_CONTRACT_BASE,
                event,
                args: { sender: sender as Hex, token: USDC_BASE },
                fromBlock: start,
                toBlock: end,
            });
            for (const log of logs) {
                if (log.transactionHash && log.blockNumber !== null) {
                    found.push({ transactionHash: log.transactionHash, blockNumber: log.blockNumber });
                }
            }
        }
        return found;
    }
}

export async function assertBaseChain(reader: SpraayChainReader): Promise<void> {
    const chainId = await reader.getChainId();
    if (chainId !== BASE_CHAIN_ID) {
        throw new Error(`Spraay payout RPC is on chain ${chainId}; v1 only supports Base (${BASE_CHAIN_ID})`);
    }
}
