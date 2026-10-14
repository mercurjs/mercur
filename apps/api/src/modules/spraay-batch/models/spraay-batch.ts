import { model } from '@medusajs/framework/utils';

export enum SpraayBatchStatus {
    ASSEMBLING = 'assembling',
    AWAITING_SIGNATURE = 'awaiting_signature',
    BROADCASTING = 'broadcasting',
    CONFIRMING = 'confirming',
    SETTLED = 'settled',
    FAILED = 'failed',
    EXPIRED = 'expired',
    CANCELED = 'canceled',
}

const SpraayBatch = model
    .define('spraay_batch', {
        id: model.id({ prefix: 'spbat' }).primaryKey(),
        status: model.enum(SpraayBatchStatus).default(SpraayBatchStatus.ASSEMBLING),
        treasury_address: model.text(),
        total_amount: model.text(),
        fee_amount: model.text().nullable(),
        recipient_count: model.number().default(0),
        unsigned_tx_to: model.text().nullable(),
        unsigned_tx_data: model.text().nullable(),
        unsigned_tx_value: model.text().nullable(),
        unsigned_tx_chain_id: model.number().nullable(),
        unsigned_tx_nonce: model.number().nullable(),
        unsigned_tx_gas: model.text().nullable(),
        prepared_block_number: model.text().nullable(),
        signed_tx_raw: model.text().nullable(),
        tx_hash: model.text().nullable(),
        block_number: model.text().nullable(),
        settled_fee_amount: model.text().nullable(),
        gateway_request: model.json().nullable(),
        gateway_response: model.json().nullable(),
        error_message: model.text().nullable(),
        expires_at: model.dateTime().nullable(),
        assembled_at: model.dateTime().nullable(),
        signed_at: model.dateTime().nullable(),
        broadcast_at: model.dateTime().nullable(),
        settled_at: model.dateTime().nullable(),
        items: model.hasMany(() => SpraayBatchItem, { mappedBy: 'batch' }),
    })
    .indexes([
        { on: ['status'], where: 'deleted_at IS NULL' },
        { on: ['tx_hash'], unique: true, where: 'tx_hash IS NOT NULL AND deleted_at IS NULL' },
    ]);

export default SpraayBatch;

import SpraayBatchItem from './spraay-batch-item';
