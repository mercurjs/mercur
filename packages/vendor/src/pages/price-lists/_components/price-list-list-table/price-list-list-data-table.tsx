import { CurrencyDollar } from "@medusajs/icons";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useExtendableTable, useLinkQuery } from "@mercurjs/dashboard-shared";
import { ExtendedPriceList } from "@custom-types/price-list";
import { _DataTable } from "@components/table/data-table";
import { usePriceLists } from "@hooks/api/price-lists";
import { useDataTable } from "@hooks/use-data-table";
import { PriceListListTableActions } from "./price-list-list-table-actions";
import { usePricingTableColumns } from "./use-pricing-table-columns";
import { usePricingTableFilters } from "./use-pricing-table-filters";
import { usePricingTableQuery } from "./use-pricing-table-query";

const PAGE_SIZE = 20;

export const PriceListListDataTable = () => {
  const { t } = useTranslation();

  const { searchParams, raw } = usePricingTableQuery({
    pageSize: PAGE_SIZE,
  });
  const linkQuery = useLinkQuery("price_list");
  const { price_lists, count, isLoading, isError, error } = usePriceLists(
    { ...searchParams, ...linkQuery },
    {
      placeholderData: keepPreviousData,
    },
  );

  const baseFilters = usePricingTableFilters();
  const { columns, filters: extFilters } = useColumns();
  const filters = useMemo(
    () => [...baseFilters, ...(extFilters as typeof baseFilters)],
    [baseFilters, extFilters],
  );

  const { table } = useDataTable({
    data: price_lists || [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  });

  if (isError) {
    throw error;
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      count={count}
      filters={filters}
      orderBy={[
        { key: "title", label: t("fields.title") },
        {
          key: "created_at",
          label: t("fields.createdAt"),
        },
        {
          key: "updated_at",
          label: t("fields.updatedAt"),
        },
      ]}
      defaultOrderBy="title"
      queryObject={raw}
      pageSize={PAGE_SIZE}
      navigateTo={(row) => row.original.id}
      isLoading={isLoading}
      noRecords={{
        icon: <CurrencyDollar className="text-ui-fg-subtle" />,
        title: t("priceLists.list.noRecords.title"),
        message: t("priceLists.list.noRecords.message"),
        action: {
          to: "create",
          label: t("actions.create"),
        },
      }}
      pagination
      search
    />
  );
};

const columnHelper = createColumnHelper<ExtendedPriceList>();

const useColumns = () => {
  const base = usePricingTableColumns();
  const { columns: extended, filters } = useExtendableTable<ExtendedPriceList>({
    model: "price_list",
    columns: base as unknown as ColumnDef<ExtendedPriceList, unknown>[],
  });

  const columns = useMemo(
    () => [
      ...extended,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <PriceListListTableActions priceList={row.original} />
        ),
      }),
    ],
    [extended],
  );

  return { columns, filters };
};
