import { Container, Divider, Heading, usePrompt, toast } from "@medusajs/ui";
import { DataTable } from "../../../../components/table/data-table";
import { createColumnHelper } from "@tanstack/react-table"
import { useDataTable } from "../../../../hooks/table/use-data-table";
import { useMemo } from "react";
import { useSellerOrdersTableQuery } from "../../helpers";
import { ProductStatusBadge } from "../../../../components/product-status-badge/product-status-badge";
import { ActionsButton } from "../../../../common/ActionsButton";
import { Thumbnail } from "../../../../components/thumbnail/thumbnail";
import { PencilSquare, Trash } from "@medusajs/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mercurQuery } from "../../../../lib/client";
import { useProductTableFilters } from "../../helpers/use-product-table-filters";

const PAGE_SIZE = 10
const PREFIX = 'sp'

export const SellerProductsSection = ({ seller_products, refetch }: { seller_products: any, refetch: () => void }) => {
  const { products, count } = seller_products

  const { raw } = useSellerOrdersTableQuery({
    pageSize: PAGE_SIZE,
    offset: 0,
    prefix: PREFIX,
  })

  const columns = useColumns(refetch)
  const filters = useProductTableFilters()

  const { table } = useDataTable({
    data: products,
    columns,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row: any) => row?.id || "",
    prefix: PREFIX,
  })

  return (
    <Container className="mt-2 px-0">
      <div className="px-8 pb-4">
        <Heading>Products</Heading>
      </div>
      <Divider />
      <DataTable
        filters={filters}
        table={table}
        columns={columns}
        count={count}
        pageSize={PAGE_SIZE}
        isLoading={false}
        queryObject={raw}
        search
        pagination
        navigateTo={(row) => `/products/${row.id}`}
        orderBy={[
          { key: "title", label: "Title" },
          { key: "created_at", label: "Created" },
          { key: "updated_at", label: "Updated" },
        ]}
        prefix={PREFIX}
      />
    </Container>
  )
}

const columnHelper = createColumnHelper<any>()

const useColumns = (refetch: () => void) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prompt = usePrompt()

  const handleDelete = async(product: any) => {
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
      await mercurQuery(`/admin/products/${product.id}`, {
        method: 'DELETE',
      })
      toast.success(t("products.toasts.delete.success.header"), {
        description: t("products.toasts.delete.success.description", {
          title: product.title,
        }),
      })
      await refetch()
    } catch (e:any) {
      toast.error(t("products.toasts.delete.error.header"), {
        description: e.message,
      })
    }

  }


  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'product',
        header: 'Product',
        cell: ({ row }) => {
          return     <div className="flex h-full w-full max-w-[250px] items-center gap-x-3 overflow-hidden">
          <div className="w-fit flex-shrink-0">
            <Thumbnail src={row.original.thumbnail} />
          </div>
          <span title={row.original.title} className="truncate">
            {row.original.title}
          </span>
        </div>
        }
      }),
      columnHelper.display({
        id: 'collection',
        header: 'Collection',
        cell: ({ row }) => {
          return row.original.collection?.title
        }
      }),
      columnHelper.display({
        id: 'variants',
        header: 'Variants',
        cell: ({ row }) => {
          const variants = row.original.variants?.length || 0
          const suffix = variants > 1 ? 'variants' : 'variant'
          
          return `${variants} ${suffix}`
        }
      }),
      columnHelper.display({
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <ProductStatusBadge status={row.original.status} />
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => <ActionsButton
          actions={[
          {
            label: "Edit",
            onClick: () => navigate(`/products/${row.original.id}/edit`),
            icon: <PencilSquare />,
          },
          {
            label: "Delete",
            onClick: () => handleDelete(row.original),
            icon: <Trash />
          }
          ]} />
      }),
    ],
    []
  )

  return columns
}