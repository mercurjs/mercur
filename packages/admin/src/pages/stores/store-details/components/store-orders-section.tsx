import { ShoppingCart } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { _DataTable } from "../../../../components/table/data-table";
import { useOrders } from "../../../../hooks/api/orders";
import { useOrderTableColumns } from "../../../../hooks/table/columns/use-order-table-columns";
import { useOrderTableFilters } from "../../../../hooks/table/filters/use-order-table-filters";
import { useOrderTableQuery } from "../../../../hooks/table/query/use-order-table-query";
import { useDataTable } from "../../../../hooks/use-data-table";

const PAGE_SIZE = 10;
const PREFIX = "store-orders";
const DEFAULT_RELATIONS = "*customer,*items,*sales_channel";
const DEFAULT_FIELDS =
  "id,status,display_id,created_at,email,fulfillment_status,payment_status,total,currency_code";

type StoreOrdersSectionProps = {
  sellerId: string;
};

export const StoreOrdersSection = ({ sellerId }: StoreOrdersSectionProps) => {
  const { t } = useTranslation();

  const { searchParams, raw } = useOrderTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  const { orders, count, isLoading, isError, error } = useOrders(
    {
      ...searchParams,
      seller_id: [sellerId],
      fields: `${DEFAULT_FIELDS},${DEFAULT_RELATIONS}`,
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const columns = useOrderTableColumns({
    exclude: ["sales_channel", "actions"],
  });
  const filters = useOrderTableFilters();

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
    <Container className="divide-y p-0" data-testid="store-orders-section">
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="store-orders-section-header"
      >
        <Heading level="h2" data-testid="store-orders-section-heading">
          {t("orders.domain")}
        </Heading>
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
          { key: "display_id", label: t("orders.fields.displayId") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        search
        queryObject={raw}
        prefix={PREFIX}
        noRecords={{
          title: t("stores.emptyStates.orders.title", "No orders yet"),
          message: t(
            "stores.emptyStates.orders.message",
            "Orders placed at this store will appear here.",
          ),
          icon: <ShoppingCart className="text-ui-fg-subtle" />,
        }}
      />
    </Container>
  );
};
