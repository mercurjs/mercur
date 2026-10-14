import { Module } from '@medusajs/framework/utils';

import './permissions';
import SpraayBatchModuleService from './service';

export const SPRAAY_BATCH_MODULE = 'spraayBatch';

export default Module(SPRAAY_BATCH_MODULE, {
    service: SpraayBatchModuleService,
});
