export enum SellerRequestUpdatedEvent {
  ACCEPTED = 'requests.seller.accepted',
  REJECTED = 'requests.seller.rejected'
}

export enum SellerRequest {
  CREATED = 'requests.seller.created'
}

export enum ProductCategoryRequestUpdatedEvent {
  ACCEPTED = 'requests.product_category.accepted',
  REJECTED = 'requests.product_category.rejected'
}

export enum ProductCollectionRequestUpdatedEvent {
  ACCEPTED = 'requests.product_collection.accepted',
  REJECTED = 'requests.product_collection.rejected'
}

export enum ProductRequestUpdatedEvent {
  CREATED = 'requests.product.created',
  ACCEPTED = 'requests.product.accepted',
  REJECTED = 'requests.product.rejected'
}

export enum SellerTeamInviteEvent {
  CREATED = 'seller.team.invite.created'
}
