import { Knex } from "@mikro-orm/postgresql";

interface QueryResult {
  id?: string;
  order_id?: string;
  order_set_id?: string;
}

interface Query {
  graph: (options: {
    entity: string;
    fields: string[];
    filters: Record<string, unknown>;
  }) => Promise<{ data: unknown[] }>;
}

export enum FulfillmentStatus {
  NOT_FULFILLED = "not_fulfilled",
  PARTIALLY_FULFILLED = "partially_fulfilled",
  FULFILLED = "fulfilled",
  PARTIALLY_SHIPPED = "partially_shipped",
  SHIPPED = "shipped",
  PARTIALLY_DELIVERED = "partially_delivered",
  DELIVERED = "delivered",
  CANCELED = "canceled",
}

export enum FulfillmentTimestampField {
  PACKED_AT = "packed_at",
  SHIPPED_AT = "shipped_at",
  DELIVERED_AT = "delivered_at",
  CANCELED_AT = "canceled_at",
}

export class OrderSetFilterHelper {
  constructor(
    private knex: Knex,
    private query: Query,
    private orderSetOrderEntity: string,
    private sellerOrderEntity: string
  ) {}

  private extractIds(
    data: unknown[],
    field: keyof QueryResult = "id"
  ): string[] {
    return (data as QueryResult[])
      .filter((item) => item[field])
      .map((item) => item[field] as string);
  }

  private async getOrderSetIdsFromOrderIds(
    orderIds: string[]
  ): Promise<string[]> {
    const { data } = await this.query.graph({
      entity: this.orderSetOrderEntity,
      fields: ["order_set_id"],
      filters: {
        order_id: orderIds,
      },
    });

    return [...new Set(this.extractIds(data, "order_set_id"))];
  }

  async handleOrderIdFilter(orderId: string): Promise<string | null> {
    const {
      data: [order_set],
    } = await this.query.graph({
      entity: this.orderSetOrderEntity,
      fields: ["order_set_id"],
      filters: {
        order_id: orderId,
      },
    });

    const result = order_set as QueryResult | undefined;
    return result?.order_set_id || null;
  }

  async handleSearchFilter(searchQuery: string): Promise<string[]> {
    const matchingOrderSetIds: Set<string> = new Set();

    const displayIdSearch = parseInt(searchQuery, 10);
    if (!isNaN(displayIdSearch)) {
      const { data: orderSetsByDisplayId } = await this.query.graph({
        entity: "order_set",
        fields: ["id"],
        filters: {
          display_id: displayIdSearch,
        },
      });
      this.extractIds(orderSetsByDisplayId).forEach((id) =>
        matchingOrderSetIds.add(id)
      );
    }

    const { data: customerMatches } = await this.query.graph({
      entity: "customer",
      fields: ["id"],
      filters: {
        $or: [
          { email: { $ilike: `%${searchQuery}%` } },
          { first_name: { $ilike: `%${searchQuery}%` } },
          { last_name: { $ilike: `%${searchQuery}%` } },
        ],
      },
    });

    if (customerMatches.length > 0) {
      const customerIds = this.extractIds(customerMatches);
      const { data: orderSetsByCustomer } = await this.query.graph({
        entity: "order_set",
        fields: ["id"],
        filters: {
          customer_id: customerIds,
        },
      });
      this.extractIds(orderSetsByCustomer).forEach((id) =>
        matchingOrderSetIds.add(id)
      );
    }

    const orderDisplayIdSearch = parseInt(searchQuery, 10);
    const orderIdFilters: Record<string, unknown>[] = [
      { id: { $ilike: `%${searchQuery}%` } },
    ];
    if (!isNaN(orderDisplayIdSearch)) {
      orderIdFilters.push({ display_id: orderDisplayIdSearch });
    }

    const { data: orderMatches } = await this.query.graph({
      entity: "order",
      fields: ["id"],
      filters: {
        $or: orderIdFilters,
      },
    });

    if (orderMatches.length > 0) {
      const orderIds = this.extractIds(orderMatches);
      const orderSetIds = await this.getOrderSetIdsFromOrderIds(orderIds);
      orderSetIds.forEach((id) => matchingOrderSetIds.add(id));
    }

    const { data: sellerMatches } = await this.query.graph({
      entity: "seller",
      fields: ["id"],
      filters: {
        name: { $ilike: `%${searchQuery}%` },
      },
    });

    if (sellerMatches.length > 0) {
      const sellerIds = this.extractIds(sellerMatches);
      const { data: sellerOrderLinks } = await this.query.graph({
        entity: this.sellerOrderEntity,
        fields: ["order_id"],
        filters: {
          seller_id: sellerIds,
        },
      });

      if (sellerOrderLinks.length > 0) {
        const vendorOrderIds = this.extractIds(sellerOrderLinks, "order_id");
        const orderSetIds =
          await this.getOrderSetIdsFromOrderIds(vendorOrderIds);
        orderSetIds.forEach((id) => matchingOrderSetIds.add(id));
      }
    }

    return Array.from(matchingOrderSetIds);
  }

  async handleSellerFilter(sellerIds: string[]): Promise<string[]> {
    const { data: sellerOrderLinks } = await this.query.graph({
      entity: this.sellerOrderEntity,
      fields: ["order_id"],
      filters: {
        seller_id: sellerIds,
      },
    });

    if (sellerOrderLinks.length === 0) {
      return [];
    }

    const orderIds = this.extractIds(sellerOrderLinks, "order_id");
    return await this.getOrderSetIdsFromOrderIds(orderIds);
  }

  async handlePaymentStatusFilter(
    paymentStatuses: string[]
  ): Promise<string[]> {
    const { data: paymentCollections } = await this.query.graph({
      entity: "payment_collection",
      fields: ["id"],
      filters: {
        status: paymentStatuses,
      },
    });

    if (paymentCollections.length === 0) {
      return [];
    }

    const paymentCollectionIds = this.extractIds(paymentCollections);
    const { data: orderSetsByPayment } = await this.query.graph({
      entity: "order_set",
      fields: ["id"],
      filters: {
        payment_collection_id: paymentCollectionIds,
      },
    });

    return this.extractIds(orderSetsByPayment);
  }

  async handleFulfillmentStatusFilter(
    statusArray: string[]
  ): Promise<string[]> {
    const { data: orderSetOrderLinks } = await this.query.graph({
      entity: this.orderSetOrderEntity,
      fields: ["order_id", "order_set_id"],
      filters: {},
    });

    const orderToOrderSetMap = new Map<string, string>();
    for (const link of orderSetOrderLinks as any[]) {
      if (link.order_id && link.order_set_id) {
        orderToOrderSetMap.set(link.order_id, link.order_set_id);
      }
    }

    if (orderToOrderSetMap.size === 0) {
      return [];
    }

    const orderStatuses = await this.calculateOrderFulfillmentStatusesSQL();

    const orderSetStatuses = new Map<string, string[]>();

    for (const { order_id, status } of orderStatuses) {
      const orderSetId = orderToOrderSetMap.get(order_id);
      if (orderSetId) {
        if (!orderSetStatuses.has(orderSetId)) {
          orderSetStatuses.set(orderSetId, []);
        }
        orderSetStatuses.get(orderSetId)!.push(status);
      }
    }

    const matchingOrderSetIds: string[] = [];

    for (const [orderSetId, statuses] of orderSetStatuses.entries()) {
      const aggregatedStatus = this.calculateAggregatedStatus(statuses);
      if (statusArray.includes(aggregatedStatus)) {
        matchingOrderSetIds.push(orderSetId);
      }
    }

    return matchingOrderSetIds;
  }

  private async calculateOrderFulfillmentStatusesSQL(): Promise<
    Array<{ order_id: string; status: string }>
  > {
    try {
      return await this.buildOrderStatusQuery(true);
    } catch {
      return await this.buildOrderStatusQuery(false);
    }
  }

  private async buildOrderStatusQuery(
    useDirectRelation: boolean
  ): Promise<Array<{ order_id: string; status: string }>> {
    const query = this.knex
      .select(
        "o.id as order_id",
        this.knex.raw(`
          COALESCE(
            CASE
              WHEN COUNT(CASE WHEN f.${FulfillmentTimestampField.DELIVERED_AT} IS NOT NULL THEN 1 END) > 0 THEN
                CASE 
                  WHEN COUNT(CASE WHEN f.${FulfillmentTimestampField.DELIVERED_AT} IS NOT NULL THEN 1 END) = 
                       COUNT(f.id) - COUNT(CASE WHEN f.${FulfillmentTimestampField.CANCELED_AT} IS NOT NULL THEN 1 END)
                    AND NOT EXISTS (
                      SELECT 1 FROM order_item oi
                      INNER JOIN order_item oid ON oid.item_id = oi.id
                      WHERE oi.order_id = o.id
                      AND oid.fulfilled_quantity::numeric < oi.quantity::numeric
                    )
                   THEN '${FulfillmentStatus.DELIVERED}'
                   ELSE '${FulfillmentStatus.PARTIALLY_DELIVERED}'
                END
              WHEN COUNT(CASE WHEN f.${FulfillmentTimestampField.SHIPPED_AT} IS NOT NULL THEN 1 END) > 0 THEN
                CASE 
                  WHEN COUNT(CASE WHEN f.${FulfillmentTimestampField.SHIPPED_AT} IS NOT NULL THEN 1 END) = 
                       COUNT(f.id) - COUNT(CASE WHEN f.${FulfillmentTimestampField.CANCELED_AT} IS NOT NULL THEN 1 END)
                    AND NOT EXISTS (
                      SELECT 1 FROM order_item oi
                      INNER JOIN order_item oid ON oid.item_id = oi.id
                      WHERE oi.order_id = o.id
                      AND oid.fulfilled_quantity::numeric < oi.quantity::numeric
                    )
                   THEN '${FulfillmentStatus.SHIPPED}'
                   ELSE '${FulfillmentStatus.PARTIALLY_SHIPPED}'
                END
              WHEN COUNT(CASE WHEN f.${FulfillmentTimestampField.PACKED_AT} IS NOT NULL THEN 1 END) > 0 THEN
                CASE 
                  WHEN COUNT(CASE WHEN f.${FulfillmentTimestampField.PACKED_AT} IS NOT NULL THEN 1 END) = 
                       COUNT(f.id) - COUNT(CASE WHEN f.${FulfillmentTimestampField.CANCELED_AT} IS NOT NULL THEN 1 END)
                    AND NOT EXISTS (
                      SELECT 1 FROM order_item oi
                      INNER JOIN order_item oid ON oid.item_id = oi.id
                      WHERE oi.order_id = o.id
                      AND oid.fulfilled_quantity::numeric < oi.quantity::numeric
                    )
                   THEN '${FulfillmentStatus.FULFILLED}'
                   ELSE '${FulfillmentStatus.PARTIALLY_FULFILLED}'
                END
              WHEN COUNT(CASE WHEN f.${FulfillmentTimestampField.CANCELED_AT} IS NOT NULL THEN 1 END) = COUNT(f.id)
                AND COUNT(f.id) > 0
               THEN '${FulfillmentStatus.CANCELED}'
               ELSE '${FulfillmentStatus.NOT_FULFILLED}'
             END,
             '${FulfillmentStatus.NOT_FULFILLED}'
          ) as status
        `)
      )
      .from("order as o");

    if (useDirectRelation) {
      query.leftJoin("fulfillment as f", "f.order_id", "o.id");
    } else {
      query
        .leftJoin("order_fulfillment as oflink", "oflink.order_id", "o.id")
        .leftJoin("fulfillment as f", "f.id", "oflink.fulfillment_id");
    }

    query.groupBy("o.id");

    const results = await query;
    return results as Array<{ order_id: string; status: string }>;
  }

  private calculateAggregatedStatus(statuses: string[]): FulfillmentStatus {
    if (statuses.every((s) => s === FulfillmentStatus.CANCELED)) {
      return FulfillmentStatus.CANCELED;
    }

    if (statuses.every((s) => s === FulfillmentStatus.DELIVERED)) {
      return FulfillmentStatus.DELIVERED;
    }

    if (statuses.every((s) => s === FulfillmentStatus.FULFILLED)) {
      return FulfillmentStatus.FULFILLED;
    }

    if (statuses.every((s) => s === FulfillmentStatus.SHIPPED)) {
      return FulfillmentStatus.SHIPPED;
    }

    if (
      statuses.some(
        (s) =>
          s === FulfillmentStatus.PARTIALLY_DELIVERED ||
          s === FulfillmentStatus.DELIVERED
      )
    ) {
      return FulfillmentStatus.PARTIALLY_DELIVERED;
    }

    if (
      statuses.some(
        (s) =>
          s === FulfillmentStatus.PARTIALLY_SHIPPED ||
          s === FulfillmentStatus.SHIPPED
      )
    ) {
      return FulfillmentStatus.PARTIALLY_SHIPPED;
    }

    if (
      statuses.some(
        (s) =>
          s === FulfillmentStatus.PARTIALLY_FULFILLED ||
          s === FulfillmentStatus.FULFILLED
      )
    ) {
      return FulfillmentStatus.PARTIALLY_FULFILLED;
    }

    return FulfillmentStatus.NOT_FULFILLED;
  }
}

export const extractIds = (
  data: unknown[],
  field: keyof QueryResult = "id"
): string[] => {
  return (data as QueryResult[])
    .filter((item) => item[field])
    .map((item) => item[field] as string);
};

export const intersectOrSetFilter = (
  filterableFields: Record<string, unknown>,
  newIds: string[]
): void => {
  if (filterableFields["id"]) {
    const existingIds = Array.isArray(filterableFields["id"])
      ? filterableFields["id"]
      : [filterableFields["id"]];
    filterableFields["id"] = existingIds.filter((id: string) =>
      newIds.includes(id)
    );
  } else {
    filterableFields["id"] = newIds;
  }
};

export const createEmptyResponse = (pagination: {
  skip: number;
  take?: number;
}) => {
  return {
    order_sets: [],
    count: 0,
    offset: pagination.skip,
    limit: pagination.take ?? 50,
  };
};
