import { keepPreviousData } from "@tanstack/react-query";
import { useMemo } from "react";

import { _DataTable } from "@components/table/data-table";
import { useProductCategories } from "@hooks/api/categories";
import { useDataTable } from "@hooks/use-data-table";
import { useCategoryTableColumns } from "./use-category-table-columns";
import { useCategoryTableQuery } from "./use-category-table-query";

const PAGE_SIZE = 20;

export const CategoryListDataTable = () => {
  const { raw, searchParams } = useCategoryTableQuery({
    pageSize: PAGE_SIZE,
  });

  const query = raw.q
    ? {
        include_ancestors_tree: true,
        fields: "id,name,handle,is_active,is_internal,parent_category",
        ...searchParams,
      }
    : {
        include_descendants_tree: true,
        parent_category_id: "null",
        fields: "id,name,category_children,handle,is_internal,is_active",
        ...searchParams,
      };

  const { product_categories, count, isLoading, isError, error } =
    useProductCategories(
      {
        ...query,
      },
      {
        placeholderData: keepPreviousData,
      },
    );

  const columns = useColumns();

  const { table } = useDataTable({
    data: product_categories || [],
    columns,
    count,
    getRowId: (original) => original.id,
    getSubRows: (original) => original.category_children,
    enableExpandableRows: true,
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
      pageSize={PAGE_SIZE}
      isLoading={isLoading}
      navigateTo={(row) => row.id}
      queryObject={raw}
      search
      pagination
    />
  );
};

const useColumns = () => {
  const base = useCategoryTableColumns();

  return useMemo(() => [...base], [base]);
};
