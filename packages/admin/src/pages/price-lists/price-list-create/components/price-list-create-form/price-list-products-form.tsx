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
import { PricingCreateSchemaType } from "./schema"

const PAGE_SIZE = 50
const PREFIX = "p"

const Root = () => {
  const { t } = useTranslation()
  const form = useTabbedForm<PricingCreateSchemaType>()
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
  // Ungrouped: one row per offer (a single seller + variant), so each selection
  // resolves to an unambiguous offer_id + variant_id. Omitting group_by_seller
  // entirely is the ungrouped path — passing it as "false" 500s the route.
  const { group_by_seller: _grouped, ...ungroupedParams } =
    searchParams as Record<string, unknown>
  const { offers, count, isLoading, isError, error } = useOffers(
    ungroupedParams,
    { placeholderData: keepPreviousData }
  )

  // offer_id -> { product_id, variant_id }, kept across pages so the selection
  // can be resolved even after paginating away from a picked row.
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
        noRecords={{
          message: t("priceLists.create.products.list.noRecordsMessage"),
        }}
      />
    </div>
  )
}

const useColumns = () => {
  const base = useOfferTableColumns()

  // The offers list ships a leading select column + a trailing OfferActions
  // menu; keep the informative columns (select … status) and drop the actions
  // menu, which is meaningless inside the picker.
  return useMemo(
    () => base.slice(0, -1) as ColumnDef<OfferDTO>[],
    [base]
  )
}

Root._tabMeta = defineTabMeta<PricingCreateSchemaType>({
  id: "product",
  labelKey: "priceLists.create.tabs.products",
  validationFields: ["product_ids"],
})

export const PriceListProductsForm = Root
