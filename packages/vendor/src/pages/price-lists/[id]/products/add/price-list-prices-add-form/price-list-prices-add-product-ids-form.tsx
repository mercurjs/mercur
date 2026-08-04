import { HttpTypes } from "@medusajs/types"
import { Checkbox, Tooltip } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import {
  ColumnDef,
  OnChangeFn,
  RowSelectionState,
  createColumnHelper,
} from "@tanstack/react-table"
import { useMemo, useRef, useState } from "react"
import { UseFormReturn } from "react-hook-form"
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
import { PriceListPricesAddSchema } from "./schema"

type PriceListPricesAddProductIdsFormProps = {
  form: UseFormReturn<PriceListPricesAddSchema>
  priceList: HttpTypes.AdminPriceList
}

const PAGE_SIZE = 50
const PREFIX = "p"

type PriceRuleShape = {
  rules?: Record<string, string> | null
  price_rules?: { attribute?: string | null; value?: string | null }[] | null
}

const extractOfferId = (price: PriceRuleShape) =>
  price.rules?.offer_id ??
  price.price_rules?.find((r) => r.attribute === "offer_id")?.value ??
  undefined

export const PriceListPricesAddProductIdsForm = ({
  priceList,
  form,
}: PriceListPricesAddProductIdsFormProps) => {
  const { t } = useTranslation()
  const { setValue } = form

  // Offers already in this price list are disabled so they can't be re-added.
  const existingOfferIds = useMemo(() => {
    const set = new Set<string>()
    for (const price of (priceList.prices ?? []) as PriceRuleShape[]) {
      const offerId = extractOfferId(price)
      if (offerId) {
        set.add(offerId)
      }
    }
    return set
  }, [priceList])

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { searchParams, raw } = useOfferTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })
  const { products, count, isLoading, isError, error } = useProducts(
    searchParams,
    { placeholderData: keepPreviousData }
  )

  const rows = (products ?? []) as OfferProduct[]

  const offerMeta = useRef<Record<string, string[]>>({})
  for (const row of rows) {
    offerMeta.current[row.id] = collectOfferIds(row)
  }

  const isAlreadyAdded = (row: OfferProduct) =>
    collectOfferIds(row).length > 0 &&
    collectOfferIds(row).every((id) => existingOfferIds.has(id))

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const state = typeof fn === "function" ? fn(rowSelection) : fn

    const productIds = Object.keys(state).filter((id) => offerMeta.current[id])
    const offerIds = Array.from(
      new Set(
        productIds
          .flatMap((id) => offerMeta.current[id] ?? [])
          .filter((id) => !existingOfferIds.has(id))
      )
    )

    setValue(
      "product_ids",
      productIds.map((id) => ({ id })),
      { shouldDirty: true, shouldTouch: true }
    )
    setValue("offer_ids", offerIds, { shouldDirty: true, shouldTouch: true })

    setRowSelection(state)
  }

  const columns = useColumns(existingOfferIds)
  const filters = useOfferTableFilters()

  const { table } = useDataTable({
    data: rows,
    columns,
    count,
    enablePagination: true,
    enableRowSelection: (row) =>
      collectOfferIds(row.original).length > 0 && !isAlreadyAdded(row.original),
    getRowId: (row) => row.id,
    rowSelection: {
      state: rowSelection,
      updater,
    },
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
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
      />
    </div>
  )
}

const columnHelper = createColumnHelper<OfferProduct>()

const useColumns = (existingOfferIds: Set<string>) => {
  const { t } = useTranslation()
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
      cell: ({ row }) => {
        const checkbox = (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
          />
        )
        const ids = collectOfferIds(row.original)
        const alreadyAdded =
          ids.length > 0 && ids.every((id) => existingOfferIds.has(id))
        if (alreadyAdded) {
          return (
            <Tooltip content={t("priceLists.products.add.alreadyInPriceList")}>
              {checkbox}
            </Tooltip>
          )
        }
        return checkbox
      },
    })

    const informative = base.slice(0, -1) as ColumnDef<OfferProduct>[]

    return [selectColumn, ...informative] as ColumnDef<OfferProduct>[]
  }, [base, existingOfferIds, t])
}
