import { MedusaService } from '@medusajs/framework/utils';

import { SpraayBatch, SpraayBatchItem } from './models';

class SpraayBatchModuleService extends MedusaService({
    SpraayBatch,
    SpraayBatchItem,
}) {}

export default SpraayBatchModuleService;
