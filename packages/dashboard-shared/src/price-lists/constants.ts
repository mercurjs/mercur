/**
 * Re-implementation of enums from `@medusajs/medusa` as they cannot be imported
 * directly. Shared by the admin and vendor price-list surfaces.
 */
export enum PriceListStatus {
  ACTIVE = "active",
  DRAFT = "draft",
}

export enum PriceListDateStatus {
  SCHEDULED = "scheduled",
  EXPIRED = "expired",
}

export enum PriceListType {
  SALE = "sale",
  OVERRIDE = "override",
}
