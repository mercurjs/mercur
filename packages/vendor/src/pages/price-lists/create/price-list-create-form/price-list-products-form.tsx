import { Checkbox } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import {
  ColumnDef,
  OnChangeFn,
  RowSelectionState,
  createColumnHelper,
} from "@tanstack/react-table"
import { useMemo, useRef, useState } from "react"
import { UseFormReturn, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { _DataTable } from "@components/table/data-table"
import { useProducts } from "@hooks/api/products"
import { useDataTable } from "@hooks/use-data-table"
import {
  collectOfferIds,
  useOfferTableColumns,
  useOfferTableFilters,
  useOfferTableQuery,
} from "@pages/offers/_components"
import { OfferProduct } from "@pages/offers/common/types"
import { PricingCreateSchemaType } from "./schema"

type PriceListProductsFormProps = {
  form: UseFormReturn<PricingCreateSchemaType>
}

const PAGE_SIZE = 50
const PREFIX = "p"

function getInitialSelection(products: { id: string }[]) {
  return products.reduce((acc, curr) => {
    acc[curr.id] = true
    return acc
  }, {} as RowSelectionState)
}

export const PriceListProductsForm = ({ form }: PriceListProductsFormProps) => {
  const { t } = useTranslation()
  const { control, setValue } = form

  const selectedIds = useWatch({ control, name: "product_ids" })

  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    getInitialSelection(selectedIds)
  )

  const { searchParams, raw } = useOfferTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })
  // One row per product (the seller's offered products). Each row's offers,
  // flattened via `collectOfferIds`, become the priceable offer ids; variant→
  // offer resolution happens in the Prices tab.
  const { products, count, isLoading, isError, error } = useProducts(
    searchParams,
    { placeholderData: keepPreviousData }
  )

  const rows = (products ?? []) as OfferProduct[]

  // product id -> offer ids, kept across pages so a selection survives paging.
  const offerMeta = useRef<Record<string, string[]>>({})
  for (const row of rows) {
    offerMeta.current[row.id] = collectOfferIds(row)
  }

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const state = typeof fn === "function" ? fn(rowSelection) : fn

    const productIds = Object.keys(state).filter(
      (id) => offerMeta.current[id]
    )
    const offerIds = Array.from(
      new Set(productIds.flatMap((id) => offerMeta.current[id] ?? []))
    )

    setValue(
      "product_ids",
      productIds.map((id) => ({ id })),
      { shouldDirty: true, shouldTouch: true }
    )
    setValue("offer_ids", offerIds, { shouldDirty: true, shouldTouch: true })

    setRowSelection(state)
  }

  const columns = useColumns()
  const filters = useOfferTableFilters()

  const { table } = useDataTable({
    data: rows,
    columns,
    count,
    enablePagination: true,
    enableRowSelection: (row) => collectOfferIds(row.original).length > 0,
    getRowId: (row) => row.id,
    rowSelection: {
      state: rowSelection,
      updater,
    },
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <div className="flex size-full flex-col">
      <_DataTable
        table={table}
        columns={columns}
        filters={filters}
        pageSize={PAGE_SIZE}
        prefix={PREFIX}
        count={count}
        isLoading={isLoading}
        layout="fill"
        orderBy={[
          { key: "title", label: t("fields.title") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        pagination
        search
        queryObject={raw}
        noRecords={{
          message: t("priceLists.create.products.list.noRecordsMessage"),
        }}
      />
    </div>
  )
}

const columnHelper = createColumnHelper<OfferProduct>()

const useColumns = () => {
  const base = useOfferTableColumns()

  return useMemo(() => {
    const selectColumn = columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    })

    // The offers columns end with an OfferActions menu; drop it in the picker.
    const informative = base.slice(0, -1) as ColumnDef<OfferProduct>[]

    return [selectColumn, ...informative] as ColumnDef<OfferProduct>[]
  }, [base])
}
