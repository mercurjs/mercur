import { createSelectParams } from '@medusajs/medusa/api/utils/validators'
import { z } from 'zod'

/**
 * @schema VendorGetStockLocationParams
 * type: object
 * properties:
 *   fields:
 *     type: string
 *     description: Comma-separated fields that should be included in the returned data.
 */
export type VendorGetStockLocationParamsType = z.infer<
  typeof VendorGetStockLocationParams
>

export const VendorGetStockLocationParams = createSelectParams()
