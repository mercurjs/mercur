import type { DijieExecutionTokenPricing, DijieRoleTokenPricing } from "./execution-token";
import {
  isPublicDijieRoleProduct,
  normalizeDijieRoleProductMetadataFromProduct,
} from "./role-product-metadata";

export type DijieQueryGraph = (query: {
  entity: string;
  fields: string[];
  filters?: Record<string, unknown>;
  pagination?: Record<string, unknown>;
}) => Promise<{ data?: unknown[] }>;

export type DijieRoleListing = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  handle: string | null;
  listingStatus: string;
  reviewState: string | null;
  developerId: string | null;
  developerName: string | null;
  packageId: string | null;
  packageVersion: string | null;
  protocolVersion: string | null;
  capabilities: string[];
  pricing: DijieExecutionTokenPricing;
  roleTokenPricing: DijieRoleTokenPricing;
  scopes: string[];
};

export type DijieInstalledRole = {
  entitlementId: string;
  entitlementSource: "order_group" | "order";
  orderId: string | null;
  authorizedAt: string | null;
  role: DijieRoleListing;
};

type UnknownRecord = Record<string, unknown>;

const BLOCKED_ORDER_STATUSES = new Set(["canceled", "cancelled"]);
const PAID_ORDER_STATUSES = new Set(["completed"]);
const PAID_PAYMENT_STATUSES = new Set(["captured", "paid", "completed"]);

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function metadata(record: UnknownRecord): UnknownRecord {
  return asRecord(record.metadata);
}

function sellerRecord(product: UnknownRecord): UnknownRecord {
  return asRecord(product.seller);
}

export function createDijieRoleListingFromProduct(productInput: unknown): DijieRoleListing | undefined {
  const product = asRecord(productInput);
  const id = nonEmptyString(product.id);
  if (!id) {
    return undefined;
  }

  const roleResult = normalizeDijieRoleProductMetadataFromProduct(product);
  if (!roleResult.ok || !isPublicDijieRoleProduct(roleResult.value)) {
    return undefined;
  }
  const role = roleResult.value;
  const seller = sellerRecord(product);
  return {
    id,
    title: nonEmptyString(role.title) ?? nonEmptyString(product.title) ?? "未命名岗位",
    subtitle: nonEmptyString(role.subtitle ?? product.subtitle) ?? null,
    description: nonEmptyString(role.description ?? product.description) ?? null,
    handle: nonEmptyString(product.handle) ?? null,
    listingStatus: role.listingStatus,
    reviewState: role.reviewState,
    developerId:
      nonEmptyString(role.developerRef) ??
      nonEmptyString(seller.id) ??
      null,
    developerName:
      nonEmptyString(seller.name) ??
      null,
    packageId: role.packageId,
    packageVersion: role.packageVersion,
    protocolVersion: role.protocolVersion,
    capabilities: role.capabilities,
    pricing: role.pricing,
    roleTokenPricing: role.roleTokenPricing,
    scopes: role.scopes,
  };
}

function orderIsBlocked(order: UnknownRecord): boolean {
  const status = nonEmptyString(order.status)?.toLowerCase();
  return Boolean(status && BLOCKED_ORDER_STATUSES.has(status));
}

function orderIsPaid(order: UnknownRecord): boolean {
  const status = nonEmptyString(order.status)?.toLowerCase();
  if (status && PAID_ORDER_STATUSES.has(status)) {
    return true;
  }

  const paymentStatus = nonEmptyString(order.payment_status)?.toLowerCase();
  if (paymentStatus && PAID_PAYMENT_STATUSES.has(paymentStatus)) {
    return true;
  }

  const paymentCollections = Array.isArray(order.payment_collections)
    ? order.payment_collections
    : [];
  return paymentCollections.some((payment) => {
    const record = asRecord(payment);
    const collectionStatus = nonEmptyString(record.status)?.toLowerCase();
    if (collectionStatus && PAID_PAYMENT_STATUSES.has(collectionStatus)) {
      return true;
    }

    const amount = Number(record.amount);
    const capturedAmount = Number(record.captured_amount);
    return Number.isFinite(amount) && amount > 0 && Number.isFinite(capturedAmount) && capturedAmount >= amount;
  });
}

function itemProductIds(itemInput: unknown): string[] {
  const item = asRecord(itemInput);
  const itemMetadata = metadata(item);
  const product = asRecord(item.product);
  const variant = asRecord(item.variant);
  const variantProduct = asRecord(variant.product);
  return [
    nonEmptyString(item.product_id),
    nonEmptyString(itemMetadata.dijieRoleListingId),
    nonEmptyString(itemMetadata.dijie_role_listing_id),
    nonEmptyString(product.id),
    nonEmptyString(variant.product_id),
    nonEmptyString(variantProduct.id),
  ].filter((value): value is string => Boolean(value));
}

function ordersFromOrderGroups(orderGroups: unknown[]): UnknownRecord[] {
  return orderGroups.flatMap((orderGroupInput) => {
    const orderGroup = asRecord(orderGroupInput);
    return Array.isArray(orderGroup.orders) ? orderGroup.orders.map(asRecord) : [];
  });
}

function uniqueByEntitlementAndRole(roles: DijieInstalledRole[]): DijieInstalledRole[] {
  const seen = new Set<string>();
  return roles.filter((role) => {
    const key = `${role.entitlementId}:${role.role.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function createDijieInstalledRolesFromMarketplaceFacts(params: {
  products: unknown[];
  orderGroups: unknown[];
  orders: unknown[];
}): DijieInstalledRole[] {
  const listings = new Map<string, DijieRoleListing>();
  for (const product of params.products) {
    const listing = createDijieRoleListingFromProduct(product);
    if (listing) {
      listings.set(listing.id, listing);
    }
  }

  const installed: DijieInstalledRole[] = [];
  const orderGroupsByOrderId = new Map<string, string>();
  for (const orderGroupInput of params.orderGroups) {
    const orderGroup = asRecord(orderGroupInput);
    const orderGroupId = nonEmptyString(orderGroup.id);
    if (!orderGroupId || !Array.isArray(orderGroup.orders)) {
      continue;
    }
    for (const order of orderGroup.orders.map(asRecord)) {
      const orderId = nonEmptyString(order.id);
      if (orderId) {
        orderGroupsByOrderId.set(orderId, orderGroupId);
      }
    }
  }

  for (const order of [...ordersFromOrderGroups(params.orderGroups), ...params.orders.map(asRecord)]) {
    if (orderIsBlocked(order) || !orderIsPaid(order)) {
      continue;
    }
    const orderId = nonEmptyString(order.id);
    const entitlementId =
      (orderId ? orderGroupsByOrderId.get(orderId) : undefined) ??
      nonEmptyString(order.order_group_id) ??
      orderId;
    if (!entitlementId) {
      continue;
    }
    const authorizedAt =
      nonEmptyString(order.created_at) ??
      nonEmptyString(order.updated_at) ??
      nonEmptyString(order.completed_at) ??
      null;
    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      for (const productId of itemProductIds(item)) {
        const role = listings.get(productId);
        if (!role) {
          continue;
        }
        installed.push({
          entitlementId,
          entitlementSource:
            orderId && orderGroupsByOrderId.has(orderId) ? "order_group" : "order",
          orderId: orderId ?? null,
          authorizedAt,
          role,
        });
      }
    }
  }

  return uniqueByEntitlementAndRole(installed);
}

export async function listDijieRoleListings(queryGraph: DijieQueryGraph): Promise<DijieRoleListing[]> {
  const { data = [] } = await queryGraph({
    entity: "product",
    fields: [
      "id",
      "title",
      "subtitle",
      "description",
      "handle",
      "status",
      "metadata",
      "seller.id",
      "seller.name",
    ],
    pagination: { take: 100 },
  });

  return data
    .map(createDijieRoleListingFromProduct)
    .filter((listing): listing is DijieRoleListing => Boolean(listing));
}

export async function listDijieInstalledRoles(params: {
  actorId: string;
  queryGraph: DijieQueryGraph;
}): Promise<DijieInstalledRole[]> {
  const [productResult, orderGroupResult, orderResult] = await Promise.all([
    params.queryGraph({
      entity: "product",
      fields: [
        "id",
        "title",
        "subtitle",
        "description",
        "handle",
        "status",
        "metadata",
        "seller.id",
        "seller.name",
      ],
      pagination: { take: 100 },
    }),
    params.queryGraph({
      entity: "order_group",
      fields: [
        "id",
        "customer_id",
        "orders.id",
        "orders.status",
        "orders.payment_status",
        "orders.created_at",
        "orders.updated_at",
        "orders.completed_at",
        "orders.payment_collections.status",
        "orders.payment_collections.amount",
        "orders.payment_collections.captured_amount",
        "orders.items.product_id",
        "orders.items.variant.product_id",
        "orders.items.variant.product.id",
        "orders.items.product.id",
        "orders.items.metadata",
      ],
      filters: { customer_id: params.actorId },
      pagination: { take: 100 },
    }),
    params.queryGraph({
      entity: "order",
      fields: [
        "id",
        "order_group_id",
        "customer_id",
        "status",
        "payment_status",
        "created_at",
        "updated_at",
        "completed_at",
        "payment_collections.status",
        "payment_collections.amount",
        "payment_collections.captured_amount",
        "items.product_id",
        "items.variant.product_id",
        "items.variant.product.id",
        "items.product.id",
        "items.metadata",
      ],
      filters: { customer_id: params.actorId },
      pagination: { take: 100 },
    }),
  ]);

  return createDijieInstalledRolesFromMarketplaceFacts({
    products: productResult.data ?? [],
    orderGroups: orderGroupResult.data ?? [],
    orders: orderResult.data ?? [],
  });
}
