import { HttpTypes } from "@medusajs/types"
import { Checkbox, Text } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import {
  OnChangeFn,
  RowSelectionState,
  createColumnHelper,
} from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  CategoryCell,
  CategoryHeader,
} from "../../../../components/table/table-cells/product/category-cell"
import {
  ProductCell,
  ProductHeader,
} from "../../../../components/table/table-cells/product/product-cell"
import {
  ProductStatusCell,
  ProductStatusHeader,
} from "../../../../components/table/table-cells/product/product-status-cell"
import { PlaceholderCell } from "../../../../components/table/table-cells/common/placeholder-cell"
import { _DataTable } from "../../../../components/table/data-table"
import { defineTabMeta } from "../../../../components/tabbed-form/types"
import { useProducts } from "../../../../hooks/api/products"
import { useProductTableFilters } from "../../../../hooks/table/filters/use-product-table-filters"
import { useProductTableQuery } from "../../../../hooks/table/query/use-product-table-query"
import { useDataTable } from "../../../../hooks/use-data-table"
import { CreateOfferFormValues } from "./schema"

const PAGE_SIZE = 10

const FIELDS = [
  "id",
  "title",
  "handle",
  "status",
  "thumbnail",
  "*collection",
  "categories.id",
  "categories.name",
  "variants.id",
].join(",")

type ProductRow = HttpTypes.AdminProduct

const Root = () => {
  const { t } = useTranslation()
  const form = useFormContext<CreateOfferFormValues>()

  const initialSelection = (form.getValues("selected_product_ids") ?? []).reduce(
    (acc, id) => {
      acc[id] = true
      return acc
    },
    {} as RowSelectionState,
  )
  const [rowSelection, setRowSelection] =
    useState<RowSelectionState>(initialSelection)

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const state = typeof fn === "function" ? fn(rowSelection) : fn
    setRowSelection(state)
    const ids = Object.keys(state)
    form.setValue("selected_product_ids", ids, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const { searchParams, raw } = useProductTableQuery({ pageSize: PAGE_SIZE })

  const { products, count, isLoading, isError, error } = useProducts(
    { ...searchParams, fields: FIELDS },
    { placeholderData: keepPreviousData },
  )

  const filters = useProductTableFilters()
  const columns = useColumns()

  const { table } = useDataTable({
    data: (products ?? []) as ProductRow[],
    columns,
    enablePagination: true,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    count,
    rowSelection: {
      state: rowSelection,
      updater,
    },
  })

  useEffect(() => {
    void form.trigger("selected_product_ids")
  }, [rowSelection, form])

  if (isError) {
    throw error
  }

  return (
    <div
      className="flex size-full flex-col"
      data-testid="offer-create-tab-catalogue"
    >
      <_DataTable
        table={table}
        count={count}
        columns={columns}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        filters={filters}
        orderBy={[
          { key: "title", label: t("fields.title") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        queryObject={raw}
        layout="fill"
        pagination
        search="autofocus"
      />
      <div className="bg-ui-bg-subtle border-t px-6 py-4">
        <p className="border-ui-border-strong txt-small text-ui-fg-subtle border-l-2 pl-3">
          <span className="text-ui-fg-base font-medium">
            {t("offers.create.tipLabel")}
          </span>{" "}
          {t("offers.create.tip")}
        </p>
      </div>
    </div>
  )
}

const columnHelper = createColumnHelper<ProductRow>()

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            data-testid="offer-create-catalogue-select-all-checkbox"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
            data-testid={`offer-create-catalogue-select-checkbox-${row.original.id}`}
          />
        ),
      }),
      columnHelper.display({
        id: "product",
        header: () => <ProductHeader />,
        cell: ({ row }) => (
          <ProductCell
            product={{
              title: row.original.title ?? "",
              thumbnail: row.original.thumbnail ?? null,
            }}
          />
        ),
      }),
      columnHelper.display({
        id: "categories",
        header: () => <CategoryHeader />,
        cell: ({ row }) => (
          <CategoryCell categories={row.original.categories} />
        ),
      }),
      columnHelper.display({
        id: "collection",
        header: t("fields.collection"),
        cell: ({ row }) => {
          const title = row.original.collection?.title
          if (!title) return <PlaceholderCell />
          return (
            <Text size="small" leading="compact" className="truncate">
              {title}
            </Text>
          )
        },
      }),
      columnHelper.display({
        id: "variants",
        header: t("offers.fields.variants"),
        cell: ({ row }) => (
          <Text size="small" leading="compact" className="truncate">
            {t("offers.fields.variantsCount", {
              count: row.original.variants?.length ?? 0,
            })}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "status",
        header: () => <ProductStatusHeader />,
        cell: ({ row }) => {
          const status = row.original.status
          if (!status) return <PlaceholderCell />
          return <ProductStatusCell status={status} />
        },
      }),
    ],
    [t],
  )
}

Root._tabMeta = defineTabMeta<CreateOfferFormValues>({
  id: "catalogue",
  labelKey: "offers.create.tabs.catalogue",
  validationFields: ["selected_product_ids"],
})

export const CreateOfferCatalogueTab = Root
