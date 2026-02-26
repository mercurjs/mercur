import { createSelectParams } from '@medusajs/medusa/api/utils/validators';
import { z } from 'zod';

export const StoreGetOrdersOrderParams = createSelectParams();

export type StoreGetOrdersOrderParamsType = z.infer<
  typeof StoreGetOrdersOrderParams
>;
