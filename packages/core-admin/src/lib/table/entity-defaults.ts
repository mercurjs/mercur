/**
 * Default fields configuration for each entity type
 * These fields are always fetched to ensure basic functionality
 */
export const ENTITY_DEFAULT_FIELDS = {
  orders: {
    properties: [
      "id",
      "status",
      "created_at",
      "email",
      "display_id",
      "payment_status",
      "fulfillment_status",
      "total",
      "currency_code",
    ],
    relations: ["*customer", "*sales_channel"],
  },

  products: {
    properties: ["id", "title", "handle", "status", "thumbnail"],
    relations: ["collection.title", "*sales_channels", "*variants"],
  },

  customers: {
    properties: [
      "id",
      "email",
      "first_name",
      "last_name",
      "created_at",
      "updated_at",
      "has_account",
    ],
    relations: ["*groups"],
  },

  inventory: {
    properties: [
      "id",
      "sku",
      "title",
      "description",
      "stocked_quantity",
      "reserved_quantity",
      "created_at",
      "updated_at",
    ],
    relations: ["*location_levels"],
  },

  // Default configuration for entities without specific defaults
  default: {
    properties: ["id", "created_at", "updated_at"],
    relations: [],
  },
} as const

export type EntityType = keyof typeof ENTITY_DEFAULT_FIELDS

/**
 * Get default fields for an entity
 */
export function getEntityDefaultFields(entity: string) {
  const config =
    ENTITY_DEFAULT_FIELDS[entity as EntityType] || ENTITY_DEFAULT_FIELDS.default
  return {
    properties: config.properties,
    relations: config.relations,
    formatted: [...config.properties, ...config.relations].join(","),
  }
}
