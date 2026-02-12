import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { Knex } from "@mikro-orm/postgresql";

export interface FilterOrderSetsInput {
  filters: {
    order_id?: string;
    seller_id?: string | string[];
    payment_status?: string | string[];
    fulfillment_status?: string | string[];
    q?: string;
    [key: string]: any;
  };
}

const FulfillmentStatus = {
  NOT_FULFILLED: "not_fulfilled",
  PARTIALLY_FULFILLED: "partially_fulfilled",
  FULFILLED: "fulfilled",
  PARTIALLY_SHIPPED: "partially_shipped",
  SHIPPED: "shipped",
  PARTIALLY_DELIVERED: "partially_delivered",
  DELIVERED: "delivered",
  CANCELED: "canceled",
} as const;

export const filterOrderSetsWithKnexStep = createStep(
  "filter-order-sets-with-knex",
  async (input: FilterOrderSetsInput, { container }) => {
    const knex = container.resolve(
      ContainerRegistrationKeys.PG_CONNECTION
    ) as Knex;

    const orderSetOrderTable = "marketplace_order_set_order_order";
    const sellerOrderTable = "seller_seller_order_order";

    let query = knex("order_set as os")
      .select("os.id")
      .distinct();

    const addedJoins = new Set<string>();

    const addJoin = (
      joinKey: string,
      joinFn: (q: typeof query) => void
    ) => {
      if (!addedJoins.has(joinKey)) {
        joinFn(query);
        addedJoins.add(joinKey);
      }
    };

    if (input.filters.order_id) {
      addJoin("order_set_order", (q) => {
        q.innerJoin(
          `${orderSetOrderTable} as oso`,
          "oso.order_set_id",
          "os.id"
        );
      });
      query.where("oso.order_id", input.filters.order_id);
    }

    if (input.filters.seller_id) {
      const sellerIds = Array.isArray(input.filters.seller_id)
        ? input.filters.seller_id
        : [input.filters.seller_id];

      addJoin("order_set_order_seller", (q) => {
        q.innerJoin(
          `${orderSetOrderTable} as oso_seller`,
          "oso_seller.order_set_id",
          "os.id"
        ).innerJoin(
          `${sellerOrderTable} as so`,
          "so.order_id",
          "oso_seller.order_id"
        );
      });

      query.whereIn("so.seller_id", sellerIds);
    }

    if (input.filters.payment_status) {
      const statuses = Array.isArray(input.filters.payment_status)
        ? input.filters.payment_status
        : [input.filters.payment_status];

      addJoin("payment_collection", (q) => {
        q.innerJoin(
          "payment_collection as pc",
          "pc.id",
          "os.payment_collection_id"
        );
      });

      query.whereIn("pc.status", statuses);
    }

    if (input.filters.fulfillment_status) {
      const statuses = Array.isArray(input.filters.fulfillment_status)
        ? input.filters.fulfillment_status
        : [input.filters.fulfillment_status];

      const fulfillmentSubquery = buildFulfillmentStatusSubquery(
        knex,
        statuses,
        orderSetOrderTable
      );
      query.whereIn("os.id", fulfillmentSubquery);
    }

    if (input.filters.q) {
      const searchQuery = input.filters.q;
      const displayId = parseInt(searchQuery, 10);

      query.where(function () {
        if (!isNaN(displayId)) {
          this.orWhere("os.display_id", displayId);
        }

        this.orWhereIn(
          "os.customer_id",
          knex("customer")
            .select("id")
            .where(function () {
              this.where("email", "ilike", `%${searchQuery}%`)
                .orWhere("first_name", "ilike", `%${searchQuery}%`)
                .orWhere("last_name", "ilike", `%${searchQuery}%`);
            })
        );

        this.orWhereIn(
          "os.id",
          knex(orderSetOrderTable)
            .select("order_set_id")
            .whereIn(
              "order_id",
              knex("order")
                .select("id")
                .where(function () {
                  this.where("id", "ilike", `%${searchQuery}%`);
                  if (!isNaN(displayId)) {
                    this.orWhere("display_id", displayId);
                  }
                })
            )
        );

        this.orWhereIn(
          "os.id",
          knex(`${orderSetOrderTable} as oso_search`)
            .select("oso_search.order_set_id")
            .innerJoin(
              `${sellerOrderTable} as so_search`,
              "so_search.order_id",
              "oso_search.order_id"
            )
            .whereIn(
              "so_search.seller_id",
              knex("seller")
                .select("id")
                .where("name", "ilike", `%${searchQuery}%`)
            )
        );
      });
    }

    const standardFilters = { ...input.filters };
    delete standardFilters.order_id;
    delete standardFilters.q;
    delete standardFilters.seller_id;
    delete standardFilters.payment_status;
    delete standardFilters.fulfillment_status;

    Object.entries(standardFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query.whereIn(`os.${key}`, value);
        } else {
          query.where(`os.${key}`, value);
        }
      }
    });

    const results = await query;
    const orderSetIds = results.map((row: any) => row.id);

    return new StepResponse({
      orderSetIds,
      isEmpty: orderSetIds.length === 0,
    });
  }
);

function buildFulfillmentStatusSubquery(
  knex: Knex,
  statuses: string[],
  orderSetOrderLink: string
): Knex.QueryBuilder {
  const fulfillmentStatusCalc = knex.raw(`
    COALESCE(
      CASE
        WHEN COUNT(CASE WHEN f.delivered_at IS NOT NULL THEN 1 END) > 0 THEN
          CASE 
            WHEN COUNT(CASE WHEN f.delivered_at IS NOT NULL THEN 1 END) = 
                 COUNT(f.id) - COUNT(CASE WHEN f.canceled_at IS NOT NULL THEN 1 END)
              AND NOT EXISTS (
                SELECT 1 FROM order_item oi
                INNER JOIN order_item oid ON oid.item_id = oi.id
                WHERE oi.order_id = o.id
                AND oid.fulfilled_quantity::numeric < oi.quantity::numeric
              )
             THEN '${FulfillmentStatus.DELIVERED}'
             ELSE '${FulfillmentStatus.PARTIALLY_DELIVERED}'
          END
        WHEN COUNT(CASE WHEN f.shipped_at IS NOT NULL THEN 1 END) > 0 THEN
          CASE 
            WHEN COUNT(CASE WHEN f.shipped_at IS NOT NULL THEN 1 END) = 
                 COUNT(f.id) - COUNT(CASE WHEN f.canceled_at IS NOT NULL THEN 1 END)
              AND NOT EXISTS (
                SELECT 1 FROM order_item oi
                INNER JOIN order_item oid ON oid.item_id = oi.id
                WHERE oi.order_id = o.id
                AND oid.fulfilled_quantity::numeric < oi.quantity::numeric
              )
             THEN '${FulfillmentStatus.SHIPPED}'
             ELSE '${FulfillmentStatus.PARTIALLY_SHIPPED}'
          END
        WHEN COUNT(CASE WHEN f.packed_at IS NOT NULL THEN 1 END) > 0 THEN
          CASE 
            WHEN COUNT(CASE WHEN f.packed_at IS NOT NULL THEN 1 END) = 
                 COUNT(f.id) - COUNT(CASE WHEN f.canceled_at IS NOT NULL THEN 1 END)
              AND NOT EXISTS (
                SELECT 1 FROM order_item oi
                INNER JOIN order_item oid ON oid.item_id = oi.id
                WHERE oi.order_id = o.id
                AND oid.fulfilled_quantity::numeric < oi.quantity::numeric
              )
             THEN '${FulfillmentStatus.FULFILLED}'
             ELSE '${FulfillmentStatus.PARTIALLY_FULFILLED}'
          END
        WHEN COUNT(CASE WHEN f.canceled_at IS NOT NULL THEN 1 END) = COUNT(f.id)
          AND COUNT(f.id) > 0
         THEN '${FulfillmentStatus.CANCELED}'
         ELSE '${FulfillmentStatus.NOT_FULFILLED}'
       END,
       '${FulfillmentStatus.NOT_FULFILLED}'
    ) as fulfillment_status
  `);

  return knex
    .with("order_fulfillment_statuses", (qb) => {
      qb.select("oso.order_set_id", "o.id as order_id", fulfillmentStatusCalc)
        .from(`${orderSetOrderLink} as oso`)
        .innerJoin("order as o", "o.id", "oso.order_id")
        .leftJoin("order_fulfillment as oflink", "oflink.order_id", "o.id")
        .leftJoin("fulfillment as f", "f.id", "oflink.fulfillment_id")
        .groupBy("oso.order_set_id", "o.id");
    })
    .with("order_set_aggregated_statuses", (qb) => {
      qb.select(
        "order_set_id",
        knex.raw(`
          CASE
            WHEN EVERY(fulfillment_status = '${FulfillmentStatus.CANCELED}') THEN '${FulfillmentStatus.CANCELED}'
            WHEN EVERY(fulfillment_status = '${FulfillmentStatus.DELIVERED}') THEN '${FulfillmentStatus.DELIVERED}'
            WHEN EVERY(fulfillment_status = '${FulfillmentStatus.FULFILLED}') THEN '${FulfillmentStatus.FULFILLED}'
            WHEN EVERY(fulfillment_status = '${FulfillmentStatus.SHIPPED}') THEN '${FulfillmentStatus.SHIPPED}'
            WHEN bool_or(fulfillment_status IN ('${FulfillmentStatus.PARTIALLY_DELIVERED}', '${FulfillmentStatus.DELIVERED}')) THEN '${FulfillmentStatus.PARTIALLY_DELIVERED}'
            WHEN bool_or(fulfillment_status IN ('${FulfillmentStatus.PARTIALLY_SHIPPED}', '${FulfillmentStatus.SHIPPED}')) THEN '${FulfillmentStatus.PARTIALLY_SHIPPED}'
            WHEN bool_or(fulfillment_status IN ('${FulfillmentStatus.PARTIALLY_FULFILLED}', '${FulfillmentStatus.FULFILLED}')) THEN '${FulfillmentStatus.PARTIALLY_FULFILLED}'
            ELSE '${FulfillmentStatus.NOT_FULFILLED}'
          END as aggregated_status
        `)
      )
        .from("order_fulfillment_statuses")
        .groupBy("order_set_id");
    })
    .select("order_set_id")
    .from("order_set_aggregated_statuses")
    .whereIn("aggregated_status", statuses);
}
