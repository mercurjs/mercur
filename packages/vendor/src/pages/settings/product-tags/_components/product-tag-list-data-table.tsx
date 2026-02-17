import { keepPreviousData } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLoaderData } from "react-router-dom";

import { _DataTable } from "@components/table/data-table";
import { useProductTags } from "@hooks/api";
import { useProductTagTableColumns } from "@hooks/table/columns";
import { useProductTagTableFilters } from "@hooks/table/filters";
import { useProductTagTableQuery } from "@hooks/table/query";
import { useDataTable } from "@hooks/use-data-table";
import { productTagListLoader } from "../../loader";

const PAGE_SIZE = 20;

export const ProductTagListDataTable = () => {
  const { t } = useTranslation();
  const { searchParams, raw } = useProductTagTableQuery({
    pageSize: PAGE_SIZE,
  });

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productTagListLoader>
  >;

  const { product_tags, count, isPending, isError, error } = useProductTags(
    searchParams,
    {
      initialData,
      placeholderData: keepPreviousData,
    },
  );

  const columns = useColumns();
  const filters = useProductTagTableFilters();

  const { table } = useDataTable({
    data: product_tags,
    count,
    columns,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  });

  if (isError) {
    throw error;
  }

  return (
    <_DataTable
      table={table}
      filters={filters}
      queryObject={raw}
      isLoading={isPending}
      columns={columns}
      pageSize={PAGE_SIZE}
      count={count}
      navigateTo={(row) => row.original.id}
      search
      pagination
      orderBy={[
        { key: "value", label: t("fields.value") },
        {
          key: "created_at",
          label: t("fields.createdAt"),
        },
        {
          key: "updated_at",
          label: t("fields.updatedAt"),
        },
      ]}
    />
  );
};

const useColumns = () => {
  const base = useProductTagTableColumns();

  return useMemo(() => [...base], [base]);
};
