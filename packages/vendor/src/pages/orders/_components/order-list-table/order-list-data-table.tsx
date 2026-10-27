import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { HttpTypes } from "@medusajs/types";
import { useExtendableTable, useLinkQuery, mergeListFilters } from "@mercurjs/dashboard-shared";

import { _DataTable } from "@components/table/data-table/data-table";
import { useOrders } from "@hooks/api/orders";
import { useOrderTableColumns } from "@hooks/table/columns/use-order-table-columns";
import { useOrderTableQuery } from "@hooks/table/query/use-order-table-query";
import { useDataTable } from "@hooks/use-data-table";
import { useOrderTableFilters } from "@hooks/table/filters";

import { ShipByCell, ShipByHeader } from "./ship-by-cell";

const PAGE_SIZE = 10;

const columnHelper = createColumnHelper<HttpTypes.AdminOrder>();

const shipByColumn = columnHelper.display({
  id: "ship_by",
  header: () => <ShipByHeader />,
  cell: ({ row }) => <ShipByCell order={row.original} />,
});

export const OrderListDataTable = () => {
  const { t } = useTranslation();
  const orderColumns = useOrderTableColumns({});
  const baseColumns = [
    ...orderColumns.slice(0, 2),
    shipByColumn as ColumnDef<HttpTypes.AdminOrder>,
    ...orderColumns.slice(2),
  ];
  const baseFilters = useOrderTableFilters();

  const { columns, filters: extFilters } =
    useExtendableTable<HttpTypes.AdminOrder>({
      model: "order",
      columns: baseColumns as unknown as ColumnDef<
        HttpTypes.AdminOrder,
        unknown
      >[],
    });

  const filters = useMemo(
    () => mergeListFilters(baseFilters, extFilters),
    [baseFilters, extFilters],
  );

  const { raw, searchParams } = useOrderTableQuery({
    pageSize: PAGE_SIZE,
    extraFilters: extFilters as typeof baseFilters,
  });

  const linkQuery = useLinkQuery(
    "order",
    [
      "id",
      "status",
      "created_at",
      "email",
      "display_id",
      "custom_display_id",
      "payment_status",
      "fulfillment_status",
      "total",
      "currency_code",
      "metadata",
      "*customer",
      "*payment_collections",
    ].join(","),
  );

  const { orders, count, isError, error, isLoading } = useOrders(
    {
      ...linkQuery,
      ...searchParams,
    },
    { placeholderData: keepPreviousData },
  );

  const { table } = useDataTable({
    data: orders ?? [],
    columns,
    enablePagination: true,
    count: count,
    pageSize: PAGE_SIZE,
  });

  if (isError) {
    throw error;
  }

  return (
    <_DataTable
      columns={columns}
      table={table}
      pagination
      search
      filters={filters}
      navigateTo={(row) => `/orders/${row.original.id}`}
      count={count}
      isLoading={isLoading}
      pageSize={PAGE_SIZE}
      orderBy={[
        {
          key: "display_id",
          label: t("orders.fields.displayId"),
        },
        {
          key: "created_at",
          label: t("fields.createdAt"),
        },
        {
          key: "updated_at",
          label: t("fields.updatedAt"),
        },
      ]}
      defaultOrderBy="-display_id"
      queryObject={raw}
      noRecords={{
        message: t("orders.list.noRecordsMessage"),
      }}
    />
  );
};
