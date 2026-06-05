import { PencilSquare, Trash } from "@medusajs/icons";
import { Button, Container, Heading, toast, usePrompt } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { ReactNode, useMemo, Children } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLoaderData, useLocation } from "react-router-dom";

import { HttpTypes } from "@medusajs/types";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { _DataTable } from "../../../../../components/table/data-table";
import {
  useDeleteProduct,
  useProducts,
} from "../../../../../hooks/api/products";
import { useProductTableColumns } from "../../../../../hooks/table/columns/use-product-table-columns";
import { useProductTableFilters } from "../../../../../hooks/table/filters/use-product-table-filters";
import { useProductTableQuery } from "../../../../../hooks/table/query/use-product-table-query";
import { useDataTable } from "../../../../../hooks/use-data-table";
import { productsLoader } from "../../loader";

const PAGE_SIZE = 20;

export const ProductListTitle = () => {
  const { t } = useTranslation();

  return (
    <Heading level="h2" data-testid="products-list-title">
      {t("products.domain")}
    </Heading>
  );
};

export const ProductListCreateButton = () => {
  const { t } = useTranslation();

  return (
    <Button
      size="small"
      variant="secondary"
      asChild
      data-testid="products-create-button"
    >
      <Link to="create" data-testid="products-create-link">
        {t("actions.create")}
      </Link>
    </Button>
  );
};

export const ProductListExportButton = () => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <Button
      size="small"
      variant="secondary"
      asChild
      data-testid="products-export-button"
    >
      <Link
        to={`export${location.search}`}
        data-testid="products-export-link"
      >
        {t("actions.export")}
      </Link>
    </Button>
  );
};

export const ProductListImportButton = () => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <Button
      size="small"
      variant="secondary"
      asChild
      data-testid="products-import-button"
    >
      <Link
        to={`import${location.search}`}
        data-testid="products-import-link"
      >
        {t("actions.import")}
      </Link>
    </Button>
  );
};

export const ProductListActions = ({ children }: { children?: ReactNode }) => {
  return (
    <div
      className="flex items-center justify-center gap-x-2"
      data-testid="products-list-actions"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ProductListExportButton />
          <ProductListImportButton />
          <ProductListCreateButton />
        </>
      )}
    </div>
  );
};

export const ProductListHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="products-list-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ProductListTitle />
          <ProductListActions />
        </>
      )}
    </div>
  );
};

export const ProductListDataTable = () => {
  const { t } = useTranslation();

  const initialData = useLoaderData() as Awaited<
    ReturnType<ReturnType<typeof productsLoader>>
  >;

  const { searchParams, raw } = useProductTableQuery({ pageSize: PAGE_SIZE });
  const { products, count, isLoading, isError, error } = useProducts(
    {
      ...searchParams,
      is_giftcard: false,
    },
    {
      initialData,
      placeholderData: keepPreviousData,
    },
  );

  const filters = useProductTableFilters();
  const columns = useColumns();

  const { table } = useDataTable({
    data: (products ?? []) as HttpTypes.AdminProduct[],
    columns,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row.id,
  });

  if (isError) {
    throw error;
  }

  return (
    <div data-testid="products-data-table">
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
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        noRecords={{
          message: t("products.list.noRecordsMessage"),
        }}
      />
    </div>
  );
};

export const ProductListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0" data-testid="products-list-table">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ProductListHeader />
          <ProductListDataTable />
        </>
      )}
      <Outlet />
    </Container>
  );
};

const ProductActions = ({ product }: { product: HttpTypes.AdminProduct }) => {
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
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/products/${product.id}/edit`,
            },
          ],
        },
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
      data-testid={`product-actions-${product.id}`}
    />
  );
};

const columnHelper = createColumnHelper<HttpTypes.AdminProduct>();

const useColumns = () => {
  const { t } = useTranslation();
  const base = useProductTableColumns();

  const columns = useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "seller",
        header: t("store.domain"),
        cell: ({ row }) => {
          const seller = (row.original as any).seller;
          return seller?.name || "-";
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => (
          <div
            className="flex h-full w-full items-center"
            data-testid="products-table-header-actions"
          >
            <span data-testid="products-table-header-actions-text"></span>
          </div>
        ),
        cell: ({ row }) => {
          return <ProductActions product={row.original} />;
        },
      }),
    ],
    [base, t],
  );

  return columns;
};
