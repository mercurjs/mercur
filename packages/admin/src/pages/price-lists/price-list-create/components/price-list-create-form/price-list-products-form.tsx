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
  const { offers, count, isLoading, isError, error } = useOffers(searchParams, {
    placeholderData: keepPreviousData,
  })

  // Each selected offer maps to its master product; the Prices tab keys the
  // grid off product_ids, so translate the offer-id row selection to a deduped
  // set of product ids. Keep the mapping across pages in a ref.
  const offerToProduct = useRef<Record<string, string>>({})
  for (const offer of (offers ?? []) as OfferDTO[]) {
    offerToProduct.current[offer.id] = offer.product_id
  }

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const state = typeof fn === "function" ? fn(rowSelection) : fn

    const productIds = Array.from(
      new Set(
        Object.keys(state)
          .map((offerId) => offerToProduct.current[offerId])
          .filter(Boolean)
      )
    )

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
