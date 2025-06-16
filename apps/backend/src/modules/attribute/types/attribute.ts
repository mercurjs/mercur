/**
 * @interface
 *
 * The data to update the attribute.
 */
export interface UpdateAttributeDTO {
  id: string
  name?: string
  description?: string
  handle?: string
  metadata?: Record<string, unknown>
  possible_values?: UpsertAttributeValueDTO[]
  product_category_ids?: { id: string }[]
}

export interface UpsertAttributeValueDTO {
  id?: string
  value?: string
  rank?: number
  metadata?: Record<string, unknown>
  attribute_id?: string
}
