import { Checkbox, toast, usePrompt } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import {
  createColumnHelper,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash } from "@medusajs/icons";

import { ExtendedAdminProduct } from "@custom-types/products";
import { ActionMenu } from "@components/common/action-menu";
import { _DataTable } from "@components/table/data-table";
import {
  useDeleteProduct,
  useBulkDeleteProducts,
  useProducts,
} from "@hooks/api/products";
import { useProductTableColumns } from "@hooks/table/columns/use-product-table-columns";
import { useProductTableFilters } from "@hooks/table/filters/use-product-table-filters";
import { useProductTableQuery } from "@hooks/table/query/use-product-table-query";
import { useDataTable } from "@hooks/use-data-table";

export const PAGE_SIZE = 10;

export const ProductListDataTable = () => {
  const { t } = useTranslation();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const updater: OnChangeFn<RowSelectionState> = (newSelection) => {
    const update =
      typeof newSelection === "function"
        ? newSelection(rowSelection)
        : newSelection;
    setRowSelection(update);
  };

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
    enableRowSelection: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row?.id || "",
    rowSelection: {
      state: rowSelection,
      updater,
    },
  });

  const { mutateAsync } = useBulkDeleteProducts();
  const prompt = usePrompt();

  const handleDelete = async () => {
    const keys = Object.keys(rowSelection);

    if (keys.length === 0) {
      return;
    }

    const res = await prompt({
      title: t("products.bulkDelete.title"),
      description: t("products.bulkDelete.description", {
        count: keys.length,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await mutateAsync(keys, {
      onSuccess: () => {
        setRowSelection({});
        toast.success(
          t("products.bulkDelete.success", {
            count: keys.length,
          }),
        );
      },
      onError: (error) => {
        toast.error(t("products.bulkDelete.error"), {
          description: error.message,
        });
      },
    });
  };

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
      commands={[
        {
          action: handleDelete,
          label: t("actions.delete"),
          shortcut: "d",
        },
      ]}
      noRecords={{
        title: t("products.list.noRecordsTitle"),
        message: t("products.list.noRecordsMessage"),
        action: {
          to: "/products/create",
          label: t("actions.add"),
        },
      }}
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
  const { t } = useTranslation();
  const base = useProductTableColumns();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => {
          return (
            <Checkbox
              checked={
                table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : table.getIsAllPageRowsSelected()
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
            />
          );
        },
        cell: ({ row }) => {
          return (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          );
        },
      }),
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <ProductActions product={row.original} />;
        },
      }),
    ],
    [base, t],
  );

  return columns;
};
