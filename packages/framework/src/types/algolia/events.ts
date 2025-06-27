export enum AlgoliaEvents {
  PRODUCTS_CHANGED = 'algolia.products.changed',
  PRODUCTS_DELETED = 'algolia.products.deleted',
  REVIEW_CHANGED = 'algolia.reviews.changed'
}

export enum IntermediateEvents {
  FULFULLMENT_SET_CHANGED = 'algolia.intermediate.fulfillment_set.changed',
  SERVICE_ZONE_CHANGED = 'algolia.intermediate.service_zone.changed',
  SHIPPING_OPTION_CHANGED = 'algolia.intermediate.shipping_option.changed',
  STOCK_LOCATION_CHANGED = 'algolia.intermediate.stock_location.changed',
  INVENTORY_ITEM_CHANGED = 'algolia.intermediate.inventory_item.changed'
}
