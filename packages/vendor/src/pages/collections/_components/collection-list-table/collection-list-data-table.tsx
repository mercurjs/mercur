import { useTranslation } from "react-i18next";
import { keepPreviousData } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { HttpTypes } from "@mercurjs/types";
import { useExtendableTable, useLinkQuery } from "@mercurjs/dashboard-shared";

import { _DataTable } from "@components/table/data-table";
import { useCollections } from "@hooks/api/collections";
import { useCollectionTableColumns } from "@hooks/table/columns/use-collection-table-columns";
import { useCollectionTableFilters } from "@hooks/table/filters";
import { useCollectionTableQuery } from "@hooks/table/query";
import { useDataTable } from "@hooks/use-data-table";

const PAGE_SIZE = 20;

export const CollectionListDataTable = () => {
  const { t } = useTranslation();
  const { searchParams, raw } = useCollectionTableQuery({
    pageSize: PAGE_SIZE,
  });
  const { collections, count, isError, error, isLoading } = useCollections(
    {
      ...searchParams,
      ...useLinkQuery("collection", "*products"),
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const baseFilters = useCollectionTableFilters();
  const { columns, filters: extFilters } = useColumns();
  const filters = useMemo(
    () => [...baseFilters, ...(extFilters as typeof baseFilters)],
    [baseFilters, extFilters],
  );

  const { table } = useDataTable({
    data: collections ?? [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row, index) => row.id ?? `${index}`,
    pageSize: PAGE_SIZE,
  });

  if (isError) {
    throw error;
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      pageSize={PAGE_SIZE}
      count={count}
      filters={filters}
      orderBy={[
        { key: "title", label: t("fields.title") },
        { key: "handle", label: t("fields.handle") },
        {
          key: "created_at",
          label: t("fields.createdAt"),
        },
        {
          key: "updated_at",
          label: t("fields.updatedAt"),
        },
      ]}
      search
      navigateTo={(row) => `/collections/${row.original.id}`}
      queryObject={raw}
      isLoading={isLoading}
    />
  );
};

type CollectionRow = HttpTypes.VendorCollectionResponse["collection"];

const useColumns = () => {
  const base = useCollectionTableColumns();
  const { columns: extended, filters } = useExtendableTable<CollectionRow>({
    model: "collection",
    columns: base as unknown as ColumnDef<CollectionRow, unknown>[],
  });

  const columns = useMemo(() => [...extended], [extended]);

  return { columns, filters };
};
