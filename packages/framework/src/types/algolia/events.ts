/**
 * *
 * @enum Algolia events
 */
export enum AlgoliaEvents {
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'algolia.products.changed'

 */
  PRODUCTS_CHANGED = "algolia.products.changed",
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'algolia.products.deleted'

 */
  PRODUCTS_DELETED = "algolia.products.deleted",
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'algolia.reviews.changed'

 */
  REVIEW_CHANGED = "algolia.reviews.changed",
}

/**
 * *
 * @enum Intermediate algolia events
 */
export enum IntermediateEvents {
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'algolia.intermediate.fulfillment_set.changed'

 */
  FULFULLMENT_SET_CHANGED = "algolia.intermediate.fulfillment_set.changed",
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'algolia.intermediate.service_zone.changed'

 */
  SERVICE_ZONE_CHANGED = "algolia.intermediate.service_zone.changed",
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'algolia.intermediate.shipping_option.changed'

 */
  SHIPPING_OPTION_CHANGED = "algolia.intermediate.shipping_option.changed",
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'algolia.intermediate.stock_location.changed'

 */
  STOCK_LOCATION_CHANGED = "algolia.intermediate.stock_location.changed",
  /**
 * *
 * SUMMARY
 * 
 * @defaultValue 'algolia.intermediate.inventory_item.changed'

 */
  INVENTORY_ITEM_CHANGED = "algolia.intermediate.inventory_item.changed",
}
