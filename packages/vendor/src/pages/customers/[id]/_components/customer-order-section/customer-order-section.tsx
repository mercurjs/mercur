import { HttpTypes } from "@medusajs/types";
import { Container, Heading } from "@medusajs/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { _DataTable } from "@components/table/data-table";
import { useOrderTableColumns } from "@hooks/table/columns/use-order-table-columns";
import { useOrderTableFilters } from "@hooks/table/filters/use-order-table-filters";
import { useOrderTableQuery } from "@hooks/table/query/use-order-table-query";
import { useDataTable } from "@hooks/use-data-table";
import { useOrders } from "@hooks/api";

type CustomerGeneralSectionProps = {
  customer: HttpTypes.AdminCustomer;
};

const PREFIX = "cusord";
const PAGE_SIZE = 10;

const DEFAULT_RELATIONS = "*customer,*items,*sales_channel";
const DEFAULT_FIELDS =
  "id,status,display_id,created_at,updated_at,email,fulfillment_status,payment_status,total,currency_code";

export const CustomerOrderSection = ({
  customer,
}: CustomerGeneralSectionProps) => {
  const { t } = useTranslation();

  const { searchParams, raw } = useOrderTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  const { orders, isLoading, isError, error } = useOrders({
    fields: DEFAULT_FIELDS + "," + DEFAULT_RELATIONS,
    limit: searchParams.limit,
    offset: searchParams.offset,
    created_at: searchParams.created_at,
    updated_at: searchParams.updated_at,
    order: searchParams.order,
    customer_id: customer.id,
  });

  const columns = useColumns();
  const filters = useOrderTableFilters();

  const count = orders?.length || 0;

  const { table } = useDataTable({
    data: orders ?? [],
    columns,
    enablePagination: true,
    count,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("orders.domain")}</Heading>
      </div>
      <_DataTable
        columns={columns}
        table={table}
        pagination
        navigateTo={(row) => `/orders/${row.original.id}`}
        filters={filters}
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
        prefix={PREFIX}
      />
    </Container>
  );
};

const useColumns = () => {
  const base = useOrderTableColumns({
    exclude: ["customer"],
  });

  return useMemo(() => [...base], [base]);
};
