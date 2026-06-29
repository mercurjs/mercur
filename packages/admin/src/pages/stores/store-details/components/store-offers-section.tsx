import { Tag } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { _DataTable } from "../../../../components/table/data-table";
import { useProducts } from "../../../../hooks/api/products";
import { useDataTable } from "../../../../hooks/use-data-table";
import { OfferProduct } from "../../../offers/common/types";
import { useOfferTableColumns } from "../../../offers/_components/use-offer-table-columns";
import { useOfferTableFilters } from "../../../offers/_components/use-offer-table-filters";
import { useOfferTableQuery } from "../../../offers/_components/use-offer-table-query";

const PAGE_SIZE = 10;
const PREFIX = "store-offers";

type StoreOffersSectionProps = {
  sellerId: string;
};

export const StoreOffersSection = ({ sellerId }: StoreOffersSectionProps) => {
  const { t } = useTranslation();

  const { searchParams, raw } = useOfferTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });
  searchParams.seller_id = [sellerId];

  const { products, count, isPending, isError, error } = useProducts(
    searchParams,
    {
      placeholderData: keepPreviousData,
    },
  );

  const rows = (products ?? []) as unknown as OfferProduct[];

  const columns = useOfferTableColumns().filter((c) => c.id !== "select");
  const filters = useOfferTableFilters().filter((f) => f.key !== "seller_id");

  const { table } = useDataTable({
    columns,
    data: rows,
    count,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0" data-testid="store-offers-section">
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="store-offers-section-header"
      >
        <Heading level="h2" data-testid="store-offers-section-heading">
          {t("offers.domain")}
        </Heading>
      </div>
      <_DataTable
        table={table}
        filters={filters}
        isLoading={isPending}
        columns={columns}
        count={count}
        pageSize={PAGE_SIZE}
        navigateTo={({ original }) => `/offers/${original.id}`}
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
          title: t("offers.empty.heading"),
          message: t("offers.empty.storeDescription"),
          icon: <Tag className="text-ui-fg-subtle" />,
        }}
      />
    </Container>
  );
};
