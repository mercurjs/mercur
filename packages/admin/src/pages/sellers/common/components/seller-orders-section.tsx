import { useMemo } from "react";

import type { AdminOrder } from "@medusajs/types";
import { Badge, Container, Heading } from "@medusajs/ui";

import { getStylizedAmount } from "@lib/money-amount-helpers";
import { createColumnHelper } from "@tanstack/react-table";

import type { AdminOrderListResponse } from "@custom-types/order";

import { DateCell } from "@components/table/table-cells/common/date-cell";
import { _DataTable } from "@components/table/data-table";

import { useOrderTableFilters } from "@hooks/table/filters";
import { useSellerOrdersTableQuery } from "@hooks/table/query";
import { useDataTable } from "@hooks/use-data-table";

const PAGE_SIZE = 10;
const PREFIX = "so";

const getOrderStatusBadgeColor = (status: string) => {
  const colors: Record<string, "orange" | "green" | "red" | "grey"> = {
    pending: "orange",
    completed: "green",
    canceled: "red",
    archived: "grey",
    requires_action: "orange",
    draft: "grey",
  };
  return colors[status] || "grey";
};

const getPaymentStatusBadgeColor = (status: string) => {
  const colors: Record<string, "orange" | "green" | "red" | "blue" | "grey"> =
    {
      captured: "green",
      paid: "green",
      partially_captured: "orange",
      awaiting: "orange",
      authorized: "blue",
      partially_authorized: "blue",
      pending: "orange",
      refunded: "red",
      partially_refunded: "orange",
      canceled: "red",
      not_paid: "grey",
      requires_action: "orange",
    };
  return colors[status] || "grey";
};

const getFulfillmentStatusBadgeColor = (status: string) => {
  const colors: Record<string, "orange" | "green" | "red" | "grey"> = {
    fulfilled: "green",
    shipped: "green",
    delivered: "green",
    partially_fulfilled: "orange",
    partially_shipped: "orange",
    partially_delivered: "orange",
    not_fulfilled: "grey",
    canceled: "red",
    returned: "red",
    partially_returned: "orange",
    requires_action: "orange",
  };
  return colors[status] || "grey";
};

const formatStatus = (status: string) =>
  status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const SellerOrdersSection = ({
  seller_orders,
}: {
  seller_orders: AdminOrderListResponse;
}) => {
  const { orders, count } = seller_orders;

  const { raw } = useSellerOrdersTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
    offset: 0,
  });

  const columns = useColumns();
  const filters = useOrderTableFilters();

  const { table } = useDataTable({
    data: orders,
    columns,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row?.id || "",
    prefix: PREFIX,
  });

  return (
    <Container className="divide-y p-0" data-testid="seller-orders-section">
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="seller-orders-section-header"
      >
        <Heading data-testid="seller-orders-section-heading">Orders</Heading>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={count}
        filters={filters}
        pageSize={PAGE_SIZE}
        isLoading={false}
        queryObject={raw}
        search
        pagination
        navigateTo={(row) => `/orders/${row.id}`}
        orderBy={[
          { key: "display_id", label: "Order" },
          { key: "created_at", label: "Created" },
          { key: "updated_at", label: "Updated" },
        ]}
        prefix={PREFIX}
      />
    </Container>
  );
};

const columnHelper = createColumnHelper<AdminOrder>();

const useColumns = () => {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "display_id",
        header: "Order",
        cell: ({ row }) => `#${row.original.display_id}`,
      }),
      columnHelper.display({
        id: "created_at",
        header: "Date",
        cell: ({ row }) => <DateCell date={row.original.created_at} />,
      }),
      columnHelper.display({
        id: "customer",
        header: "Customer",
        cell: ({ row }) => {
          return row.original.customer?.first_name &&
            row.original.customer?.last_name
            ? `${row.original.customer?.first_name} ${row.original.customer?.last_name}`
            : row.original.customer?.email;
        },
      }),
      columnHelper.display({
        id: "status",
        header: "Order Status",
        cell: ({ row }) => (
          <Badge
            size="2xsmall"
            color={getOrderStatusBadgeColor(row.original.status)}
          >
            {formatStatus(row.original.status)}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "payment_status",
        header: "Payment Status",
        cell: ({ row }) => {
          const status = row.original?.payment_status;
          if (!status) return "-";
          return (
            <Badge
              size="2xsmall"
              color={getPaymentStatusBadgeColor(status)}
            >
              {formatStatus(status)}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "fulfillment_status",
        header: "Fulfillment Status",
        cell: ({ row }) => {
          const status = row.original.fulfillment_status;
          if (!status) return "-";
          return (
            <Badge
              size="2xsmall"
              color={getFulfillmentStatusBadgeColor(status)}
            >
              {formatStatus(status)}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "total",
        header: "Order Total",
        cell: ({ row }) => {
          if (
            typeof row.original.total === "undefined" ||
            row.original.total === null
          ) {
            return "-";
          }

          const formatted = getStylizedAmount(
            row.original.total,
            row.original.currency_code,
          );

          return (
            <div className="flex h-full w-full items-center justify-start overflow-hidden text-left">
              <span className="truncate">{formatted}</span>
            </div>
          );
        },
      }),
    ],
    [],
  );

  return columns;
};
