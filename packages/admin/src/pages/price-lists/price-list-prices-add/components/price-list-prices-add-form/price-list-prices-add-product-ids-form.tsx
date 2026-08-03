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
import { useTranslation } from "react-i18next"

import { OfferDTO } from "@mercurjs/types"

import { _DataTable } from "../../../../../components/table/data-table"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { useOffers } from "../../../../../hooks/api/offers"
import { usePriceList } from "../../../../../hooks/api/price-lists"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useOfferTableColumns } from "../../../../offers/_components/use-offer-table-columns"
import { useOfferTableFilters } from "../../../../offers/_components/use-offer-table-filters"
import { useOfferTableQuery } from "../../../../offers/_components/use-offer-table-query"
import { PriceListPricesAddSchema } from "./schema"

type PriceListPricesAddProductIdsFormProps = {
  priceList: HttpTypes.AdminPriceList
}

const PAGE_SIZE = 50
const PREFIX = "p"

const Root = ({ priceList }: PriceListPricesAddProductIdsFormProps) => {
  const { t } = useTranslation()
  const form = useTabbedForm<PriceListPricesAddSchema>()
  const { setValue } = form

  // Offers already in this price list are disabled so they can't be re-added.
  const { price_list: pricedList } = usePriceList(priceList.id, {
    fields: "id,+prices.price_rules.attribute,+prices.price_rules.value",
  })
  const existingOfferIds = useMemo(() => {
    const set = new Set<string>()
    for (const price of pricedList?.prices ?? []) {
      const offerId = (price as { rules?: Record<string, string> }).rules
        ?.offer_id
      if (offerId) {
        set.add(offerId)
      }
    }
    return set
  }, [pricedList])

  const isAlreadyAdded = (row: OfferDTO) =>
    (row.offer_ids ?? [row.id]).some((id) => existingOfferIds.has(id))

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { searchParams, raw } = useOfferTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })
  // Grouped: one row per (store, product). Each row's `offer_ids` covers every
  // variant that store offers for the product; variant→offer resolution happens
  // in the Prices tab.
  const { offers, count, isLoading, isError, error } = useOffers(searchParams, {
    placeholderData: keepPreviousData,
  })

  const offerMeta = useRef<
    Record<string, { product_id: string; offer_ids: string[] }>
  >({})
  for (const offer of (offers ?? []) as OfferDTO[]) {
    offerMeta.current[offer.id] = {
      product_id: offer.product_id,
      offer_ids: offer.offer_ids ?? [offer.id],
    }
  }

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const state = typeof fn === "function" ? fn(rowSelection) : fn

    const selectedRowIds = Object.keys(state).filter(
      (rowId) => offerMeta.current[rowId]
    )

    const productIds = Array.from(
      new Set(selectedRowIds.map((id) => offerMeta.current[id].product_id))
    )

    const offerIds = Array.from(
      new Set(selectedRowIds.flatMap((id) => offerMeta.current[id].offer_ids))
    )

    setValue(
      "product_ids",
      productIds.map((id) => ({ id })),
      { shouldDirty: true, shouldTouch: true }
    )
    setValue("offer_ids", offerIds, {
      shouldDirty: true,
      shouldTouch: true,
    })

    setRowSelection(state)
  }

  const columns = useColumns(t)
  const filters = useOfferTableFilters()

  const { table } = useDataTable({
    data: (offers ?? []) as OfferDTO[],
    columns,
    count,
    enablePagination: true,
    enableRowSelection: (row) => !isAlreadyAdded(row.original),
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
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        defaultOrder="-created_at"
        pagination
        search
        queryObject={raw}
      />
    </div>
  )
}

const columnHelper = createColumnHelper<OfferDTO>()

const useColumns = (t: (key: string) => string) => {
  const base = useOfferTableColumns()

  return useMemo(() => {
    // Replace the offer list's select column with one that disables rows
    // already in the price list, and drop the trailing actions column.
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
        if (!row.getCanSelect()) {
          return (
            <Tooltip content={t("priceLists.products.add.alreadyInPriceList")}>
              {checkbox}
            </Tooltip>
          )
        }
        return checkbox
      },
    }) as ColumnDef<OfferDTO>

    return [
      selectColumn,
      ...(base.slice(1, -1) as ColumnDef<OfferDTO>[]),
    ]
  }, [base, t])
}

Root._tabMeta = defineTabMeta<PriceListPricesAddSchema>({
  id: "product",
  labelKey: "priceLists.create.tabs.products",
  validationFields: ["product_ids"],
})

export const PriceListPricesAddProductIdsForm = Root
