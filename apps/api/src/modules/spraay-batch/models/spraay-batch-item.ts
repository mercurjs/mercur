import { model } from '@medusajs/framework/utils';

const SpraayBatchItem = model
    .define('spraay_batch_item', {
        id: model.id({ prefix: 'spitm' }).primaryKey(),
        payout_id: model.text(),
        wallet_address: model.text(),
        amount: model.text(),
        currency_code: model.text().default('usdc'),
        released_at: model.dateTime().nullable(),
        batch: model.belongsTo(() => SpraayBatch, { mappedBy: 'items' }),
    })
    .indexes([
        { on: ['payout_id'], unique: true, where: 'deleted_at IS NULL AND released_at IS NULL' },
        { on: ['wallet_address'], where: 'deleted_at IS NULL' },
    ]);

export default SpraayBatchItem;

import SpraayBatch from './spraay-batch';
