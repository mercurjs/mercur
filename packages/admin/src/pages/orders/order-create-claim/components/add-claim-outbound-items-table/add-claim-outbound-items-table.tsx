import { HttpTypes } from "@medusajs/types"
import { OfferDTO } from "@mercurjs/types"
import { OnChangeFn, RowSelectionState } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "@components/table/data-table"
import { useOffers } from "@hooks/api/offers"
import { useDataTable } from "@hooks/use-data-table"

import {
  ClaimOutboundOfferPickerRow,
  useClaimOutboundItemTableColumns,
} from "./use-claim-outbound-item-table-columns"
import { useClaimOutboundItemTableFilters } from "./use-claim-outbound-item-table-filters"
import { useClaimOutboundItemTableQuery } from "./use-claim-outbound-item-table-query"

const PAGE_SIZE = 50
const PREFIX = "rit"

const OFFER_PICKER_FIELDS = [
  "id",
  "sku",
  "variant_id",
  "seller_id",
  "prices.amount",
  "prices.currency_code",
  "product_variant.id",
  "product_variant.title",
  "product_variant.product.id",
  "product_variant.product.title",
  "product_variant.product.thumbnail",
  "product_variant.manage_inventory",
  "product_variant.inventory_quantity",
  "product_variant.inventory_items.required_quantity",
  "product_variant.inventory_items.inventory.location_levels.available_quantity",
].join(",")

type ClaimOutboundOfferPickerRowExtended = ClaimOutboundOfferPickerRow &
  Pick<OfferDTO, "prices"> & {
    product_variant?: ClaimOutboundOfferPickerRow["product_variant"] &
      Pick<
        HttpTypes.AdminProductVariant,
        "manage_inventory" | "inventory_quantity" | "inventory_items"
      >
  }

type AddClaimOutboundItemsTableProps = {
  currencyCode?: string
  /**
   * Receives the picked rows' variant IDs. See add-order-edit-items-table
   * for why admin maps row id to variant rather than offer.
   */
  onSelectionChange: (variantIds: string[]) => void
  selectedItems?: string[]
}

const offerHasInventory = (
  offer: ClaimOutboundOfferPickerRowExtended
): boolean => {
  const variant = offer.product_variant
  if (!variant) return false
  if (variant.manage_inventory === false) return true

  const links = variant.inventory_items ?? []
  if (!links.length) {
    return (variant.inventory_quantity ?? 0) > 0
  }
  return links.every((link) => {
    const available = (link.inventory?.location_levels ?? []).reduce(
      (acc, lvl) => acc + (lvl.available_quantity ?? 0),
      0
    )
    const required = link.required_quantity ?? 1
    return required > 0 && available >= required
  })
}

export const AddClaimOutboundItemsTable = ({
  currencyCode,
  onSelectionChange,
  selectedItems = [],
}: AddClaimOutboundItemsTableProps) => {
  const { t } = useTranslation()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    selectedItems.reduce<RowSelectionState>((acc, id) => {
      acc[id] = true
      return acc
    }, {})
  )

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const newState: RowSelectionState =
      typeof fn === "function" ? fn(rowSelection) : fn

    setRowSelection(newState)
    onSelectionChange(Object.keys(newState))
  }

  const { searchParams, raw } = useClaimOutboundItemTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const offersResponse = useOffers({
    ...searchParams,
    fields: OFFER_PICKER_FIELDS,
  }) as unknown as {
    offers?: ClaimOutboundOfferPickerRowExtended[]
    count?: number
  }
  const rawCount = offersResponse.count ?? 0

  const offers = useMemo<ClaimOutboundOfferPickerRowExtended[]>(() => {
    const rawOffers = offersResponse.offers ?? []
    return rawOffers.filter((offer) => {
      if (currencyCode) {
        const hasPrice = (offer.prices ?? []).some(
          (p) => p.currency_code === currencyCode
        )
        if (!hasPrice) return false
      }
      return offerHasInventory(offer)
    })
  }, [offersResponse.offers, currencyCode])

  const count = offers.length
  void rawCount

  const columns = useClaimOutboundItemTableColumns()
  const filters = useClaimOutboundItemTableFilters()

  const { table } = useDataTable({
    data: offers,
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.variant_id ?? row.id,
    pageSize: PAGE_SIZE,
    enableRowSelection: () => true,
    rowSelection: {
      state: rowSelection,
      updater,
    },
    prefix: PREFIX,
  })

  return (
    <div
      className="flex size-full flex-col overflow-hidden"
      data-testid="add-offers-picker"
    >
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        filters={filters}
        pagination
        layout="fill"
        search
        orderBy={[
          { key: "sku", label: t("fields.sku") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        prefix={PREFIX}
        queryObject={raw}
      />
    </div>
  )
}
