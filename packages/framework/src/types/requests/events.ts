export enum SellerAccountRequestUpdatedEvent {
  ACCEPTED = "requests.seller.accepted",
  REJECTED = "requests.seller.rejected",
}

export enum SellerRequest {
  CREATED = "requests.seller.created",
  TO_CREATE = "requests.seller.to_create",
}

export enum RequestUpdated {
  CREATED = "requests.*.created",
}

export enum ProductCategoryRequestUpdatedEvent {
  ACCEPTED = "requests.product_category.accepted",
  REJECTED = "requests.product_category.rejected",
}

export enum ProductCollectionRequestUpdatedEvent {
  ACCEPTED = "requests.product_collection.accepted",
  REJECTED = "requests.product_collection.rejected",
}

export enum ProductRequestUpdatedEvent {
  CREATED = "requests.product.created",
  ACCEPTED = "requests.product.accepted",
  REJECTED = "requests.product.rejected",
  TO_CREATE = "requests.product.to_create",
  DELETED = "requests.product.deleted"
}

export enum ProductUpdateRequestUpdatedEvent {
  CREATED = "requests.product_update.created",
  ACCEPTED = "requests.product_update.accepted",
  REJECTED = "requests.product_update.rejected",
  TO_CREATE = "requests.product_update.to_create",
}

export enum ImportSellerProductsRequestUpdatedEvent {
  TO_CREATE = "requests.import_seller_products.to_create",
}

export enum SellerTeamInviteEvent {
  CREATED = "seller.team.invite.created",
}

export enum ProductTypeRequestUpdatedEvent {
  ACCEPTED = "requests.product_type.accepted",
  REJECTED = "requests.product_type.rejected",
}

export enum ProductTagRequestUpdatedEvent {
  ACCEPTED = "requests.product_tag.accepted",
  REJECTED = "requests.product_tag.rejected",
}

export enum RemoveReviewRequestUpdatedEvent {
  REMOVED = "requests.review.removed",
}
