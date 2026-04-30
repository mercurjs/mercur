import { toast, usePrompt } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Trash } from "@medusajs/icons";

import { ExtendedAdminProduct } from "@custom-types/products";
import { ActionMenu } from "@components/common/action-menu";
import { _DataTable } from "@components/table/data-table";
import { useDeleteProduct, useProducts } from "@hooks/api/products";
import { useProductTableColumns } from "@hooks/table/columns/use-product-table-columns";
import { useProductTableFilters } from "@hooks/table/filters/use-product-table-filters";
import { useProductTableQuery } from "@hooks/table/query/use-product-table-query";
import { useDataTable } from "@hooks/use-data-table";

export const PAGE_SIZE = 10;

export const ProductListDataTable = () => {
  const { t } = useTranslation();

  const { searchParams, raw } = useProductTableQuery({
    pageSize: PAGE_SIZE,
  });

  const { products, count, isLoading, isError, error } = useProducts(
    searchParams,
    {
      placeholderData: keepPreviousData,
    },
  );

  const filters = useProductTableFilters();
  const columns = useColumns();

  const { table } = useDataTable({
    data: products,
    columns,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row?.id || "",
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
      filters={filters}
      search
      pagination
      isLoading={isLoading}
      queryObject={raw}
      navigateTo={(row) => `${row.original.id}`}
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
    />
  );
};

const ProductActions = ({ product }: { product: ExtendedAdminProduct }) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { mutateAsync } = useDeleteProduct(product.id);

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.deleteWarning", {
        title: product.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(t("products.toasts.delete.success.header"), {
          description: t("products.toasts.delete.success.description", {
            title: product.title,
          }),
        });
      },
      onError: (e) => {
        toast.error(t("products.toasts.delete.error.header"), {
          description: e.message,
        });
      },
    });
  };

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
    />
  );
};

const columnHelper = createColumnHelper<ExtendedAdminProduct>();

const useColumns = () => {
  const base = useProductTableColumns();

  const columns = useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <ProductActions product={row.original} />;
        },
      }),
    ],
    [base],
  );

  return columns;
};
