import { HttpTypes } from "@medusajs/types"
import { keepPreviousData } from "@tanstack/react-query"
import {
  ColumnDef,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table"
import { useMemo, useRef, useState } from "react"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { OfferDTO } from "@mercurjs/types"

import { _DataTable } from "../../../../../components/table/data-table"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { useOffers } from "../../../../../hooks/api/offers"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useOfferTableColumns } from "../../../../offers/_components/use-offer-table-columns"
import { useOfferTableFilters } from "../../../../offers/_components/use-offer-table-filters"
import { useOfferTableQuery } from "../../../../offers/_components/use-offer-table-query"
import { PriceListCreateProductsSchema } from "../../../common/schemas"
import { PriceListPricesAddSchema } from "./schema"

type PriceListPricesAddProductIdsFormProps = {
  priceList: HttpTypes.AdminPriceList
}

const PAGE_SIZE = 50
const PREFIX = "p"

const Root = (_props: PriceListPricesAddProductIdsFormProps) => {
  const { t } = useTranslation()
  const form = useTabbedForm<PriceListPricesAddSchema>()
  const { control, setValue } = form

  const productRecords = useWatch({
    control,
    name: "products",
  })

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { searchParams, raw } = useOfferTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })
  // Ungrouped: omit group_by_seller entirely (passing "false" 500s the route)
  // so each row is one offer with an unambiguous offer_id + variant_id.
  const { group_by_seller: _grouped, ...ungroupedParams } =
    searchParams as Record<string, unknown>
  const { offers, count, isLoading, isError, error } = useOffers(
    ungroupedParams,
    { placeholderData: keepPreviousData }
  )

  const offerMeta = useRef<
    Record<string, { product_id: string; variant_id: string }>
  >({})
  for (const offer of (offers ?? []) as OfferDTO[]) {
    offerMeta.current[offer.id] = {
      product_id: offer.product_id,
      variant_id: offer.variant_id,
    }
  }

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const state = typeof fn === "function" ? fn(rowSelection) : fn

    const selectedOfferIds = Object.keys(state).filter(
      (offerId) => offerMeta.current[offerId]
    )

    const productIds = Array.from(
      new Set(selectedOfferIds.map((id) => offerMeta.current[id].product_id))
    )

    const variantOffers = selectedOfferIds.reduce((acc, offerId) => {
      acc[offerMeta.current[offerId].variant_id] = offerId
      return acc
    }, {} as Record<string, string>)

    const updatedRecords = productIds.reduce((acc, id) => {
      if (productRecords?.[id]) {
        acc[id] = productRecords[id]
      }
      return acc
    }, {} as PriceListCreateProductsSchema)

    setValue(
      "product_ids",
      productIds.map((id) => ({ id })),
      { shouldDirty: true, shouldTouch: true }
    )
    setValue("products", updatedRecords, {
      shouldDirty: true,
      shouldTouch: true,
    })
    setValue("variant_offers", variantOffers, {
      shouldDirty: true,
      shouldTouch: true,
    })

    setRowSelection(state)
  }

  const columns = useColumns()
  const filters = useOfferTableFilters()

  const { table } = useDataTable({
    data: (offers ?? []) as OfferDTO[],
    columns,
    count,
    enablePagination: true,
    enableRowSelection: true,
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

const useColumns = () => {
  const base = useOfferTableColumns()

  return useMemo(
    () => base.slice(0, -1) as ColumnDef<OfferDTO>[],
    [base]
  )
}

Root._tabMeta = defineTabMeta<PriceListPricesAddSchema>({
  id: "product",
  labelKey: "priceLists.create.tabs.products",
  validationFields: ["product_ids"],
})

export const PriceListPricesAddProductIdsForm = Root
