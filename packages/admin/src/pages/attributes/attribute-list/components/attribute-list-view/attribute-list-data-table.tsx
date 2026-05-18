import { keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { _DataTable } from "../../../../../components/table/data-table";
import { useProductAttributes } from "../../../../../hooks/api";
import { useAttributeTableColumns } from "../../../../../hooks/table/columns/use-attribute-table-columns";
import { useAttributeTableFilters } from "../../../../../hooks/table/filters/use-attribute-table-filters";
import { useAttributeTableQuery } from "../../../../../hooks/table/query/use-attribute-table-query";
import { useDataTable } from "../../../../../hooks/use-data-table";

const PAGE_SIZE = 20;

export const AttributeListDataTable = () => {
  const { t } = useTranslation();

  const { searchParams, raw } = useAttributeTableQuery({ pageSize: PAGE_SIZE });
  const { product_attributes, count, isPending, isError, error } =
    useProductAttributes(searchParams, {
      placeholderData: keepPreviousData,
    });

  const filters = useAttributeTableFilters();
  const columns = useAttributeTableColumns();

  const { table } = useDataTable({
    data: product_attributes ?? [],
    count,
    columns,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    enablePagination: true,
  });

  if (isError) {
    throw error;
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      count={count}
      pageSize={PAGE_SIZE}
      isLoading={isPending}
      filters={filters}
      orderBy={[
        { key: "name", label: t("fields.name") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      navigateTo={(row) => row.original.id}
      pagination
      search
      queryObject={raw}
      noRecords={{
        message: t("attributes.list.noRecordsMessage"),
      }}
      data-testid="attribute-list-table"
    />
  );
};
