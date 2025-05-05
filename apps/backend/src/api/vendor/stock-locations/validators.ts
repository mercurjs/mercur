import { z } from 'zod'

import { applyAndAndOrOperators } from '@medusajs/medusa/api/utils/common-validators/common'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetStockLocationParamsType = z.infer<
  typeof VendorGetStockLocationParams
>

export const VendorGetStockLocationsParamsDirectFields = z.object({
  stock_location_id: z.union([z.string(), z.array(z.string())]).optional()
})

export const VendorGetStockLocationParams = createFindParams({
  limit: 20,
  offset: 0
})
  .merge(VendorGetStockLocationsParamsDirectFields)
  .merge(applyAndAndOrOperators(VendorGetStockLocationsParamsDirectFields))

/**
 * @schema UpsertStockLocationAddress
 * type: object
 * required:
 *   - address_1
 *   - country_code
 * properties:
 *   address_1:
 *     type: string
 *     description: Address line 1
 *   address_2:
 *     type: string
 *     nullable: true
 *     description: Address line 2
 *   company:
 *     type: string
 *     nullable: true
 *     description: Company name
 *   city:
 *     type: string
 *     nullable: true
 *     description: City
 *   country_code:
 *     type: string
 *     description: Country code
 *   phone:
 *     type: string
 *     nullable: true
 *     description: Phone number
 *   postal_code:
 *     type: string
 *     nullable: true
 *     description: Postal code
 *   province:
 *     type: string
 *     nullable: true
 *     description: Province
 */
export const UpsertStockLocationAddress = z.object({
  address_1: z.string(),
  address_2: z.string().nullish(),
  company: z.string().nullish(),
  city: z.string().nullish(),
  country_code: z.string(),
  phone: z.string().nullish(),
  postal_code: z.string().nullish(),
  province: z.string().nullish()
})

export type VendorCreateStockLocationType = z.infer<
  typeof VendorCreateStockLocation
>
/**
 * @schema VendorCreateStockLocation
 * type: object
 * required:
 *   - name
 * properties:
 *   name:
 *     type: string
 *     description: Name of the stock location
 *   address:
 *     $ref: "#/components/schemas/UpsertStockLocationAddress"
 *   address_id:
 *     type: string
 *     nullable: true
 *     description: ID of an existing address to use
 *   metadata:
 *     type: object
 *     nullable: true
 *     description: Additional metadata
 */
export const VendorCreateStockLocation = z.object({
  name: z.preprocess((val: string) => val?.trim(), z.string()),
  address: UpsertStockLocationAddress.optional(),
  address_id: z.string().nullish(),
  metadata: z.record(z.unknown()).nullish()
})

export type VendorUpdateStockLocationType = z.infer<
  typeof VendorUpdateStockLocation
>
/**
 * @schema VendorUpdateStockLocation
 * type: object
 * properties:
 *   name:
 *     type: string
 *     description: Name of the stock location
 *   address:
 *     $ref: "#/components/schemas/UpsertStockLocationAddress"
 *   address_id:
 *     type: string
 *     nullable: true
 *     description: ID of an existing address to use
 *   metadata:
 *     type: object
 *     nullable: true
 *     description: Additional metadata
 */
export const VendorUpdateStockLocation = z.object({
  name: z
    .preprocess((val: string) => val.trim(), z.string().optional())
    .optional(),
  address: UpsertStockLocationAddress.optional(),
  address_id: z.string().nullish(),
  metadata: z.record(z.unknown()).nullish()
})

export type VendorCreateStockLocationFulfillmentSetType = z.infer<
  typeof VendorCreateStockLocationFulfillmentSet
>
/**
 * @schema VendorCreateStockLocationFulfillmentSet
 * type: object
 * required:
 *   - name
 *   - type
 * properties:
 *   name:
 *     type: string
 *     description: Name of the fulfillment set
 *   type:
 *     type: string
 *     description: Type of the fulfillment set
 */
export const VendorCreateStockLocationFulfillmentSet = z
  .object({
    name: z.string(),
    type: z.string()
  })
  .strict()
