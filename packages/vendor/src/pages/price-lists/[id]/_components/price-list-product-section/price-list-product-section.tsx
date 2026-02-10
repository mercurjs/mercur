import { PencilSquare, Plus, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Checkbox, Container, Heading, toast, usePrompt } from "@medusajs/ui"
import { RowSelectionState, createColumnHelper } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"
import { _DataTable } from "@components/table/data-table"
import {
  usePriceListLinkProducts,
  usePriceListProducts,
} from "@hooks/api/price-lists"
import { useProductTableColumns } from "@hooks/table/columns/use-product-table-columns"
import { useProductTableQuery } from "@hooks/table/query/use-product-table-query"
import { useDataTable } from "@hooks/use-data-table"
import { ExtendedAdminProduct } from "@custom-types/products"

type PriceListProductSectionProps = {
  priceList: HttpTypes.AdminPriceList
}

const PAGE_SIZE = 10
const PREFIX = "p"

export const PriceListProductSection = ({
  priceList,
}: PriceListProductSectionProps) => {
  const { t } = useTranslation()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { searchParams, raw } = useProductTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const { products, count, isLoading, isError, error } = usePriceListProducts(
    priceList.id,
    {
      limit: searchParams.limit?.toString() ?? PAGE_SIZE,
      offset: searchParams.offset?.toString() ?? 0,
    }
  )

  const columns = useColumns(priceList)

  const { table } = useDataTable({
    data: products || [],
    count,
    columns,
    enablePagination: true,
    enableRowSelection: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row.id,
    rowSelection: {
      state: rowSelection,
      updater: setRowSelection,
    },
    prefix: PREFIX,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("priceLists.products.header")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("priceLists.products.actions.addProducts"),
                  to: "products/add",
                  icon: <Plus />,
                },
                {
                  label: t("priceLists.products.actions.editPrices"),
                  to: "products/edit",
                  icon: <PencilSquare />,
                  disabled: count === 0,
                  disabledTooltip: t("priceLists.products.actions.editPricesDisabled"),
                },
              ],
            },
          ]}
        />
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={count}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        navigateTo={(row) => `/products/${row.original.id}`}
        pagination
        prefix={PREFIX}
        queryObject={raw}
      />
    </Container>
  )
}

const ProductRowAction = ({
  product,
  priceList,
}: {
  product: ExtendedAdminProduct
  priceList: HttpTypes.AdminPriceList
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = usePriceListLinkProducts(priceList.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("priceLists.products.delete.confirmation", {
        count: 1,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    mutateAsync(
      {
        remove: [product.id],
      },
      {
        onSuccess: () => {
          toast.success("Product removed from price list")
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("priceLists.products.actions.editPrices"),
              to: `products/edit`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.remove"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<ExtendedAdminProduct>()

const useColumns = (priceList: HttpTypes.AdminPriceList) => {
  const base = useProductTableColumns()

  return useMemo(
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
          )
        },
        cell: ({ row }) => {
          return (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              onClick={(e) => {
                e.stopPropagation()
              }}
            />
          )
        },
      }),
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <ProductRowAction product={row.original} priceList={priceList} />
        ),
      }),
    ],
    [base, priceList]
  )
}
