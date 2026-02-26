import { useMemo } from "react"

import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, toast, usePrompt } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../components/common/action-menu"
import { Thumbnail } from "@components/common/thumbnail"
import { ProductStatusCell } from "@components/table/table-cells/product/product-status-cell"
import { _DataTable } from "@components/table/data-table"

import { useProducts } from "../../../../hooks/api/products"
import { useProductTableFilters } from "@hooks/table/filters"
import { useProductTableQuery } from "@hooks/table/query"
import { useDataTable } from "@hooks/use-data-table"

const PAGE_SIZE = 10
const PREFIX = "selprod"
const DEFAULT_FIELDS =
  "*collection,+type_id,+tag_id,+sales_channel_id,+status,+created_at,+updated_at"

export const SellerProductSection = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = useProductTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const { products, count, isLoading, isError, error } = useProducts(
    {
      fields: DEFAULT_FIELDS,
      ...searchParams,
    },
    {
      placeholderData: keepPreviousData,
    }
  )

  const columns = useColumns()
  const filters = useProductTableFilters()

  const { table } = useDataTable({
    data: products ?? [],
    columns,
    enablePagination: true,
    count,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.domain")}</Heading>
      </div>
      <_DataTable
        columns={columns}
        table={table}
        pagination
        navigateTo={(row) => `/products/${row.id}`}
        filters={filters}
        count={count}
        isLoading={isLoading}
        pageSize={PAGE_SIZE}
        orderBy={[
          { key: "title", label: t("fields.title") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        search
        queryObject={raw}
        prefix={PREFIX}
      />
    </Container>
  )
}

const columnHelper = createColumnHelper<HttpTypes.AdminProduct>()

const useColumns = () => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const handleDelete = async (product: HttpTypes.AdminProduct) => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.deleteWarning", {
        title: product.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    try {
      // TODO: use useDeleteProduct hook when refactoring to per-row component
      const response = await fetch(`/admin/products/${product.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete product")
      }
      toast.success(t("products.toasts.delete.success.header"), {
        description: t("products.toasts.delete.success.description", {
          title: product.title,
        }),
      })
    } catch (e: unknown) {
      toast.error(t("products.toasts.delete.error.header"), {
        description: (e as Error)?.message,
      })
    }
  }

  return useMemo(
    () => [
      columnHelper.display({
        id: "product",
        header: "Product",
        cell: ({ row }) => {
          return (
            <div className="flex h-full w-full max-w-[250px] items-center gap-x-3 overflow-hidden">
              <div className="w-fit flex-shrink-0">
                <Thumbnail src={row.original.thumbnail} />
              </div>
              <span title={row.original.title} className="truncate">
                {row.original.title}
              </span>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "collection",
        header: "Collection",
        cell: ({ row }) => {
          return row.original.collection?.title
        },
      }),
      columnHelper.display({
        id: "variants",
        header: "Variants",
        cell: ({ row }) => {
          const variants = row.original.variants?.length || 0
          const suffix = variants > 1 ? "variants" : "variant"
          return `${variants} ${suffix}`
        },
      }),
      columnHelper.display({
        id: "status",
        header: "Status",
        cell: ({ row }) => <ProductStatusCell status={row.original.status} />,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    to: `/products/${row.original.id}/edit`,
                    icon: <PencilSquare />,
                  },
                ],
              },
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    onClick: () => handleDelete(row.original),
                    icon: <Trash />,
                  },
                ],
              },
            ]}
          />
        ),
      }),
    ],
    []
  )
}
