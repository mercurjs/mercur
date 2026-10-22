import { z } from '@medusajs/framework/zod';

import { SpraayBatchStatus } from '../../../modules/spraay-batch/models';

export type AdminGetSpraayBatchesParamsType = z.infer<typeof AdminGetSpraayBatchesParams>;
export const AdminGetSpraayBatchesParams = z.object({
    status: z.union([z.nativeEnum(SpraayBatchStatus), z.array(z.nativeEnum(SpraayBatchStatus))]).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

export type AdminSignSpraayBatchType = z.infer<typeof AdminSignSpraayBatch>;
export const AdminSignSpraayBatch = z.object({
    signed_transaction: z.string().regex(/^0x[0-9a-fA-F]+$/, 'signed_transaction must be a 0x-prefixed hex string'),
});
