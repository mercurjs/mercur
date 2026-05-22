import { HttpTypes } from "@medusajs/types"
import { Checkbox } from "@medusajs/ui"
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
  ProductStatusCell,
  ProductStatusHeader,
} from "../../../../components/table/table-cells/product/product-status-cell"
import { PlaceholderCell } from "../../../../components/table/table-cells/common/placeholder-cell"
import { Thumbnail } from "../../../../components/common/thumbnail"
import { _DataTable } from "../../../../components/table/data-table"
import { defineTabMeta } from "../../../../components/tabbed-form/types"
import { useVariants } from "../../../../hooks/api/product-variants"
import { useProductVariantsTableQuery } from "../../../../hooks/table/query/use-product-variants-table-query"
import { useDataTable } from "../../../../hooks/use-data-table"
import { CreateOfferFormValues } from "./schema"

const PAGE_SIZE = 10

const FIELDS = [
  "id",
  "title",
  "sku",
  "ean",
  "upc",
  "product_id",
  "product.id",
  "product.title",
  "product.thumbnail",
  "product.status",
  "product.categories.id",
  "product.categories.name",
].join(",")

type VariantRow = HttpTypes.AdminProductVariant & {
  ean?: string | null
  upc?: string | null
}

const Root = () => {
  const { t } = useTranslation()
  const form = useFormContext<CreateOfferFormValues>()

  const initialSelection = (form.getValues("selected_variant_ids") ?? []).reduce(
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
    form.setValue("selected_variant_ids", ids, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const { searchParams, raw } = useProductVariantsTableQuery({
    pageSize: PAGE_SIZE,
  })

  const {
    variants,
    count,
    isPending: isLoading,
    isError,
    error,
  } = useVariants(
    { ...searchParams, fields: FIELDS },
    { placeholderData: keepPreviousData },
  )

  const columns = useColumns()

  const { table } = useDataTable({
    data: (variants ?? []) as VariantRow[],
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
    void form.trigger("selected_variant_ids")
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
      <div className="bg-ui-bg-subtle text-ui-fg-subtle border-t px-6 py-4">
        <span className="txt-small">{t("offers.create.tip")}</span>
      </div>
    </div>
  )
}

const columnHelper = createColumnHelper<VariantRow>()

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
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
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
        id: "title",
        header: t("fields.title"),
        cell: ({ row }) => {
          const variant = row.original
          const title = variant.title ?? ""
          if (!title) return <PlaceholderCell />
          return (
            <div className="flex h-full w-full max-w-[320px] items-center gap-x-3 overflow-hidden">
              <div className="w-fit flex-shrink-0">
                <Thumbnail src={variant.product?.thumbnail ?? null} />
              </div>
              <span className="truncate" title={title}>
                {title}
              </span>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "categories",
        header: () => <CategoryHeader />,
        cell: ({ row }) => (
          <CategoryCell categories={row.original.product?.categories} />
        ),
      }),
      columnHelper.accessor("sku", {
        header: t("fields.sku"),
        cell: ({ getValue }) => {
          const sku = getValue()
          if (!sku) return <PlaceholderCell />
          return (
            <div className="flex h-full w-full items-center overflow-hidden">
              <span className="truncate">{sku}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("ean", {
        header: t("offers.fields.ean"),
        cell: ({ getValue }) => {
          const value = getValue()
          if (!value) return <PlaceholderCell />
          return (
            <div className="flex h-full w-full items-center overflow-hidden">
              <span className="truncate">{value}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("upc", {
        header: t("offers.fields.upc"),
        cell: ({ getValue }) => {
          const value = getValue()
          if (!value) return <PlaceholderCell />
          return (
            <div className="flex h-full w-full items-center overflow-hidden">
              <span className="truncate">{value}</span>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "status",
        header: () => <ProductStatusHeader />,
        cell: ({ row }) => {
          const status = row.original.product?.status
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
  validationFields: ["selected_variant_ids"],
})

export const CreateOfferCatalogueTab = Root
