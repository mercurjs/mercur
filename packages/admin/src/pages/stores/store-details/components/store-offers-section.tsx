import { Tag } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { RowSelectionState } from "@tanstack/react-table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { OfferDTO } from "@mercurjs/types";
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared";

import { _DataTable } from "../../../../components/table/data-table";
import { useOffers } from "../../../../hooks/api/offers";
import { useDataTable } from "../../../../hooks/use-data-table";
import { useOfferTableColumns } from "../../../offers/_components/use-offer-table-columns";
import { useOfferTableCommands } from "../../../offers/_components/use-offer-table-commands";
import { useOfferTableFilters } from "../../../offers/_components/use-offer-table-filters";
import { useOfferTableQuery } from "../../../offers/_components/use-offer-table-query";

const PAGE_SIZE = 10;
const PREFIX = "store-offers";

type StoreOffersSectionProps = {
  sellerId: string;
};

export const StoreOffersSection = ({ sellerId }: StoreOffersSectionProps) => {
  const { t } = useTranslation();

  const [selection, setSelection] = useState<RowSelectionState>({});

  const { raw, searchParams } = useOfferTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  const { offers, count, isLoading, isError, error } = useOffers(
    { ...searchParams, seller_id: [sellerId] },
    { placeholderData: keepPreviousData },
  );

  const rows = (offers ?? []) as OfferDTO[];

  const columns = useOfferTableColumns({ hideStoreAction: true });
  const filters = useOfferTableFilters().filter((f) => f.key !== "seller_id");
  const commands = useOfferTableCommands({
    onDeleted: () => setSelection({}),
  });

  const { table } = useDataTable({
    data: rows,
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
    enableRowSelection: true,
    rowSelection: {
      state: selection,
      updater: setSelection,
    },
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
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        isLoading={isLoading}
        pagination
        search
        filters={filters}
        queryObject={raw}
        prefix={PREFIX}
        orderBy={[
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        defaultOrder="-created_at"
        navigateTo={(row) =>
          `/offers/${row.original.product_id}?seller_id=${row.original.seller_id}`
        }
        noRecords={{
          title: t("offers.empty.heading"),
          message: t("offers.empty.storeDescription"),
          icon: <Tag className="text-ui-fg-subtle" />,
        }}
        commands={commands}
      />
      <DisplayExtensionZone model="seller" zone="offers" data={sellerId} />
    </Container>
  );
};
