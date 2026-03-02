import { _DataTable } from "@components/table/data-table";
import { useOrderGroups } from "@hooks/api/order-groups";
import { useOrderTableQuery } from "@hooks/table/query";
import { useDataTable } from "@hooks/use-data-table";
import { Container, Heading, IconButton, clx } from "@medusajs/ui";
import { TriangleRightMini } from "@medusajs/icons";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  DateCell,
  DateHeader,
} from "@components/table/table-cells/common/date-cell";
import {
  TextCell,
  TextHeader,
} from "@components/table/table-cells/common/text-cell";
import {
  PaymentStatusCell,
  PaymentStatusHeader,
} from "@components/table/table-cells/order/payment-status-cell";
import {
  FulfillmentStatusCell,
  FulfillmentStatusHeader,
} from "@components/table/table-cells/order/fulfillment-status-cell";
import { getStylizedAmount } from "@lib/money-amount-helpers";

import { DEFAULT_FIELDS } from "../../const";
import { useOrderGroupTableFilters } from "./use-order-table-filters";

const PAGE_SIZE = 20;

export type OrderGroupRow = {
  _type: "group" | "order";
  id: string;
  display_id: string;
  order_ids: string;
  vendor: string;
  created_at: Date;
  updated_at: Date;
  customer_name: string;
  payment_status: string | null;
  fulfillment_status: string | null;
  total: number | null;
  currency_code: string;
  children: OrderGroupRow[];
};

function transformOrderGroups(orderGroups: any[]): OrderGroupRow[] {
  return orderGroups.map((group) => {
    const orders = group.orders ?? [];

    const orderIds = orders.map((o: any) => `#${o.display_id}`).join(", ");

    const firstOrder = orders[0];
    const customerName = firstOrder?.customer
      ? `${firstOrder.customer.first_name ?? ""} ${firstOrder.customer.last_name ?? ""}`.trim()
      : "-";

    const currencyCode = firstOrder?.currency_code ?? "usd";

    const children: OrderGroupRow[] = orders.map((order: any) => {
      const name = order.customer
        ? `${order.customer.first_name ?? ""} ${order.customer.last_name ?? ""}`.trim()
        : "-";

      return {
        _type: "order" as const,
        id: order.id,
        display_id: `#${order.display_id}`,
        order_ids: "",
        vendor: order.seller?.name ?? "-",
        created_at: new Date(order.created_at),
        updated_at: new Date(order.updated_at),
        customer_name: name,
        payment_status: order.payment_status ?? null,
        fulfillment_status: order.fulfillment_status ?? null,
        total: order.total ?? null,
        currency_code: order.currency_code ?? "usd",
        children: [],
      };
    });

    return {
      _type: "group" as const,
      id: group.id,
      display_id: `#G${group.display_id}`,
      order_ids: orderIds,
      vendor: `${group.seller_count} vendors`,
      created_at: new Date(group.created_at),
      updated_at: new Date(group.updated_at),
      customer_name: customerName,
      payment_status: null,
      fulfillment_status: null,
      total: group.total ?? null,
      currency_code: currencyCode,
      children,
    };
  });
}

export const OrderListTable = () => {
  const { t } = useTranslation();

  const { searchParams, raw } = useOrderTableQuery({
    pageSize: PAGE_SIZE,
  });

  const { order_groups, count, isError, error, isLoading } = useOrderGroups(
    {
      ...searchParams,
      fields: DEFAULT_FIELDS,
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const rows = useMemo(
    () => transformOrderGroups(order_groups ?? []),
    [order_groups],
  );

  const filters = useOrderGroupTableFilters();
  const columns = useColumns();

  const { table } = useDataTable({
    data: rows,
    columns,
    enablePagination: true,
    enableExpandableRows: true,
    getSubRows: (row) => row.children,
    getRowId: (row) => row.id,
    count,
    pageSize: PAGE_SIZE,
  });

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0" data-testid="orders-container">
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="orders-header"
      >
        <Heading data-testid="orders-heading">{t("orders.domain")}</Heading>
      </div>
      <div data-testid="orders-table-wrapper">
        <_DataTable
          columns={columns}
          table={table}
          pagination
          navigateTo={(row) =>
            row.original._type === "order" ? `/orders/${row.original.id}` : ""
          }
          count={count}
          search
          filters={filters}
          isLoading={isLoading}
          pageSize={PAGE_SIZE}
          orderBy={[
            { key: "display_id", label: "Display ID" },
            { key: "created_at", label: t("fields.createdAt") },
            { key: "updated_at", label: t("fields.updatedAt") },
          ]}
          queryObject={raw}
          noRecords={{
            message: t("orders.list.noRecordsMessage"),
          }}
        />
      </div>
    </Container>
  );
};

const columnHelper = createColumnHelper<OrderGroupRow>();

const useColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: () => <TextHeader text="Group ID" />,
        cell: ({ row, getValue }) => {
          if (row.original._type === "order") {
            return null;
          }

          const expandHandler = row.getToggleExpandedHandler();

          return (
            <div className="flex size-full items-center gap-x-2 overflow-hidden">
              <div className="flex size-7 items-center justify-center">
                {row.getCanExpand() ? (
                  <IconButton
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      expandHandler();
                    }}
                    size="small"
                    variant="transparent"
                    className="text-ui-fg-subtle"
                  >
                    <TriangleRightMini
                      className={clx({
                        "rotate-90 transition-transform will-change-transform":
                          row.getIsExpanded(),
                      })}
                    />
                  </IconButton>
                ) : null}
              </div>
              <span className="truncate">{getValue()}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("order_ids", {
        header: () => <TextHeader text="Order IDs" />,
        cell: ({ row, getValue }) => {
          if (row.original._type === "group") {
            return <TextCell text={getValue()} />;
          }
          return <TextCell text={row.original.display_id} />;
        },
      }),
      columnHelper.accessor("vendor", {
        header: () => <TextHeader text="Vendor" />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("created_at", {
        header: () => <DateHeader />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("customer_name", {
        header: () => <TextHeader text={t("fields.customer")} />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("payment_status", {
        header: () => <PaymentStatusHeader />,
        cell: ({ row, getValue }) => {
          if (row.original._type === "group") {
            return null;
          }
          const status = getValue();
          if (!status) return "-";
          return <PaymentStatusCell status={status as any} />;
        },
      }),
      columnHelper.accessor("fulfillment_status", {
        header: () => <FulfillmentStatusHeader />,
        cell: ({ row, getValue }) => {
          if (row.original._type === "group") {
            return null;
          }
          const status = getValue();
          if (!status) return "-";
          return <FulfillmentStatusCell status={status as any} />;
        },
      }),
      columnHelper.accessor("total", {
        header: () => <TextHeader text={t("fields.total")} />,
        cell: ({ row, getValue }) => {
          const total = getValue();
          if (total == null) return "-";
          return (
            <TextCell
              text={getStylizedAmount(total, row.original.currency_code)}
            />
          );
        },
      }),
    ],
    [t],
  );
};
