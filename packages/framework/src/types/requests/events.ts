/**
 * *
 * @enum
 * 
 * Seller account request updated event

 */
export enum SellerAccountRequestUpdatedEvent {
  /**
 * *
 * The seller account request accepted event.
 * 
 * @defaultValue "requests.seller.accepted"

 */
  ACCEPTED = "requests.seller.accepted",
  /**
 * *
 * The seller account request rejected event.
 * 
 * @defaultValue "requests.seller.rejected"

 */
  REJECTED = "requests.seller.rejected",
}

/**
 * *
 * @enum
 * 
 * Seller request updated event

 */
export enum SellerRequest {
  /**
 * *
 * The seller request created event.
 * 
 * @defaultValue "requests.seller.created"

 */
  CREATED = "requests.seller.created",
}

/**
 * *
 * @enum
 *
 * Request updated event
 */
export enum RequestUpdated {
  /**
 * *
 * The request updated event.
 * 
 * @defaultValue "requests.*.created"

 */
  CREATED = "requests.*.created",
}

/**
 * *
 * @enum
 * 
 * Product category request updated event

 */
export enum ProductCategoryRequestUpdatedEvent {
  /**
 * *
 * The product category request accepted event.
 * 
 * @defaultValue "requests.product_category.accepted"

 */
  ACCEPTED = "requests.product_category.accepted",
  /**
 * *
 * The product category request rejected event.
 * 
 * @defaultValue "requests.product_category.rejected"

 */
  REJECTED = "requests.product_category.rejected",
}

/**
 * *
 * @enum
 * 
 * Product collection request updated event

 */
export enum ProductCollectionRequestUpdatedEvent {
  /**
 * *
 * The product collection request accepted event.
 * 
 * @defaultValue "requests.product_collection.accepted"

 */
  ACCEPTED = "requests.product_collection.accepted",
  /**
 * *
 * The product collection request rejected event.
 * 
 * @defaultValue "requests.product_collection.rejected"

 */
  REJECTED = "requests.product_collection.rejected",
}

/**
 * *
 * @enum
 * 
 * Product request updated event

 */
export enum ProductRequestUpdatedEvent {
  /**
 * *
 * The product request created event.
 * 
 * @defaultValue "requests.product.created"

 */
  CREATED = "requests.product.created",
  /**
 * *
 * The product request accepted event.
 * 
 * @defaultValue "requests.product.accepted"

 */
  ACCEPTED = "requests.product.accepted",
  /**
 * *
  * The product request rejected event.
 * 
 * @defaultValue "requests.product.rejected"

 */
  REJECTED = "requests.product.rejected",
}

/**
 * *
 * @enum
 * 
 * Product update request updated event

 */
export enum ProductUpdateRequestUpdatedEvent {
  /**
 * *
 * The product update request created event.
 * 
 * @defaultValue "requests.product_update.created"

 */
  CREATED = "requests.product_update.created",
  /**
 * *
 * The product update request accepted event.
 * 
 * @defaultValue "requests.product_update.accepted"

 */
  ACCEPTED = "requests.product_update.accepted",
  /**
 * *
 * The product update request rejected event.
 * 
 * @defaultValue "requests.product_update.rejected"

 */
  REJECTED = "requests.product_update.rejected",
}

/**
 * *
 * @enum
 * 
 * Seller team invite event

 */
export enum SellerTeamInviteEvent {
  /**
 * *
 * The seller team invite created event.
 * 
 * @defaultValue "seller.team.invite.created"

 */
  CREATED = "seller.team.invite.created",
}

/**
 * *
 * @enum
 * 
 * Product type request updated event

 */
export enum ProductTypeRequestUpdatedEvent {
  /**
 * *
 * The product type request accepted event.
 * 
 * @defaultValue "requests.product_type.accepted"

 */
  ACCEPTED = "requests.product_type.accepted",
  /**
 * *
 * The product type request rejected event.
 * 
 * @defaultValue "requests.product_type.rejected"

 */
  REJECTED = "requests.product_type.rejected",
}

/**
 * *
 * @enum
 * 
 * Product tag request updated event

 */
export enum ProductTagRequestUpdatedEvent {
  /**
 * *
 * The product tag request accepted event.
 * 
 * @defaultValue "requests.product_tag.accepted"

 */
  ACCEPTED = "requests.product_tag.accepted",
  /**
 * *
 * The product tag request rejected event.
 * 
 * @defaultValue "requests.product_tag.rejected"

 */
  REJECTED = "requests.product_tag.rejected",
}
