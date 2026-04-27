import { Tag } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { _DataTable } from "../../../../components/table/data-table";
import { useSellerProducts } from "../../../../hooks/api/sellers";
import { useProductTableColumns } from "../../../../hooks/table/columns/use-product-table-columns";
import { useProductTableFilters } from "../../../../hooks/table/filters/use-product-table-filters";
import { useProductTableQuery } from "../../../../hooks/table/query/use-product-table-query";
import { useDataTable } from "../../../../hooks/use-data-table";

const PAGE_SIZE = 10;
const PREFIX = "store-products";

type StoreProductsSectionProps = {
  sellerId: string;
};

export const StoreProductsSection = ({
  sellerId,
}: StoreProductsSectionProps) => {
  const { t } = useTranslation();

  const { searchParams, raw } = useProductTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  const { products, count, isPending, isError, error } = useSellerProducts(
    sellerId,
    searchParams,
    {
      placeholderData: keepPreviousData,
    },
  );

  const columns = useProductTableColumns();
  const filters = useProductTableFilters(["product_types"]);

  const { table } = useDataTable({
    columns,
    data: products ?? [],
    count,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0" data-testid="store-products-section">
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="store-products-section-header"
      >
        <Heading level="h2" data-testid="store-products-section-heading">
          {t("products.domain")}
        </Heading>
      </div>
      <_DataTable
        table={table}
        filters={filters}
        isLoading={isPending}
        columns={columns}
        count={count}
        pageSize={PAGE_SIZE}
        navigateTo={({ original }) => `/products/${original.id}`}
        orderBy={[
          { key: "title", label: t("fields.title") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        queryObject={raw}
        search
        pagination
        prefix={PREFIX}
        noRecords={{
          title: t("stores.emptyStates.products.title", "No products yet"),
          message: t(
            "stores.emptyStates.products.message",
            "Products published by this store will appear here.",
          ),
          icon: <Tag className="text-ui-fg-subtle" />,
        }}
      />
    </Container>
  );
};
