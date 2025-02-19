/**
 * @schema AdminCommissionRate
 * title: "CommissionRate"
 * description: "Commission rate object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier.
 *   type:
 *     type: string
 *     enum: [flat, percentage]
 *     description: Commission rate type.
 *   percentage_rate:
 *     type: number
 *     description: Percent of commission.
 *   include_tax:
 *     type: boolean
 *     description: Indicates if rate is calculated including tax.
 *   price_set_id:
 *     type: string
 *     description: Flat commission value.
 *   min_price_set_id:
 *     type: string
 *     description: Min commission value.
 *   max_price_set_id:
 *     type: string
 *     description: Max commission value.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 */

/**
 * @schema AdminCommissionRule
 * title: "CommissionRule"
 * description: "Commission rule object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier.
 *   name:
 *     type: string
 *     description: Commission rule name.
 *   reference:
 *     type: string
 *     description: Rule reference type
 *   reference_id:
 *     type: string
 *     description: Rule reference id
 *   is_active:
 *     type: boolean
 *     description: Indicates if rule is active.
 *   rate:
 *     $ref: '#/components/schemas/AdminCommissionRate'
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 */

/**
 * @schema AdminCommissionAggregate
 * title: "CommissionAggregate"
 * description: "Commission aggregate object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier.
 *   name:
 *     type: string
 *     description: Commission rule name.
 *   type:
 *     type: string
 *     enum: [flat, percentage]
 *     description: Commission rate type.
 *   reference:
 *     type: string
 *     description: Rule reference type
 *   reference_id:
 *     type: string
 *     description: Rule reference id
 *   is_active:
 *     type: boolean
 *     description: Indicates if rule is active.
 *   include_tax:
 *     type: boolean
 *     description: Indicates if rate is calculated including tax.
 *   percentage_rate:
 *     type: number
 *     description: Percent of commission.
 *   price_id:
 *     type: string
 *     description: Flat rate price id
 *   price_currency:
 *     type: string
 *     description: Flat rate price currency code
 *   price_amount:
 *     type: string
 *     description: Flat rate price amount
 *   min_price_id:
 *     type: string
 *     description: Min price id
 *   min_price_currency:
 *     type: string
 *     description: Min price currency code
 *   min_price_amount:
 *     type: string
 *     description: Min price amount
 *   max_price_id:
 *     type: string
 *     description: Max price id
 *   max_price_currency:
 *     type: string
 *     description: Max price currency code
 *   max_price_amount:
 *     type: string
 *     description: Max price amount
 *   fee_value:
 *     type: string
 *     description: Aggregated fee value
 *   ref_value:
 *     type: string
 *     description: Aggregated reference value
 */
