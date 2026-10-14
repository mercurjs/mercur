import type { InferTypeOf } from '@medusajs/framework/types';

import type { SpraayBatch, SpraayBatchItem } from './models';

export type SpraayBatchItemDTO = Omit<InferTypeOf<typeof SpraayBatchItem>, 'batch'>;

export type SpraayBatchDTO = Omit<InferTypeOf<typeof SpraayBatch>, 'items'> & {
    items: SpraayBatchItemDTO[];
};

export type AdminSpraayBatchListResponse = {
    batches: SpraayBatchDTO[];
    count: number;
    limit: number;
    offset: number;
};

export type AdminSpraayBatchResponse = {
    batch: SpraayBatchDTO;
};

export type AdminSpraayUnsignedTransaction = {
    to: string;
    data: string;
    value: string;
    chainId: number;
    nonce: number;
    gas: string | null;
};

export type AdminSpraayPrepareResponse = {
    batch_id: string;
    status: string;
    unsigned_transaction: AdminSpraayUnsignedTransaction;
    approval_required: {
        token?: string;
        spender?: string;
        amount?: string;
        amountFormatted?: string;
    } | null;
};

export type AdminSpraaySignResponse = {
    batch_id: string;
    tx_hash: string;
    status: string;
};

export type AdminSpraayCancelResponse = {
    batch_id: string;
    status: string;
    payouts_released: boolean;
};

export type AdminSpraayTriggerResponse = {
    batch_id: string | null;
    message: string;
};

export type AdminSpraayPreflightChecks = {
    rpc: boolean;
    chain_id?: number;
    block_number?: string;
    contract_paused?: boolean;
    treasury_address?: string;
    usdc_balance?: string;
    usdc_balance_raw?: string;
    usdc_allowance?: string;
    usdc_allowance_raw?: string;
    eth_balance_raw?: string;
    fee_bps?: string;
    required_usdc_raw?: string;
};

export type AdminSpraayPreflightResponse = {
    ready: boolean;
    checks: AdminSpraayPreflightChecks;
    problems: string[];
};
