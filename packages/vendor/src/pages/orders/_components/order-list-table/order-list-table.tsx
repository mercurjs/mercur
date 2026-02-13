import { Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { _DataTable } from "@components/table/data-table/data-table";
import { useOrders } from "@hooks/api/orders";
import { useOrderTableColumns } from "@hooks/table/columns/use-order-table-columns";
import { useOrderTableQuery } from "@hooks/table/query/use-order-table-query";
import { useDataTable } from "@hooks/use-data-table";
import { useSearchParams } from "react-router-dom";
import { useOrderTableFilters } from "@hooks/table/filters";

const PAGE_SIZE = 10;

export const OrderListTable = () => {
  const { t } = useTranslation();
  const { raw, searchParams } = useOrderTableQuery({
    pageSize: PAGE_SIZE,
  });

  const { orders, count, isError, error, isLoading } = useOrders({
    fields: [
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
      "*customer",
      "*sales_channel",
      "*payment_collections",
    ].join(","),
    ...searchParams,
  });

  const columns = useOrderTableColumns({});
  const filters = useOrderTableFilters();

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
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("orders.domain")}</Heading>
      </div>
      <_DataTable
        columns={columns}
        table={table}
        pagination
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
        queryObject={raw}
        noRecords={{
          message: t("orders.list.noRecordsMessage"),
        }}
      />
    </Container>
  );
};
