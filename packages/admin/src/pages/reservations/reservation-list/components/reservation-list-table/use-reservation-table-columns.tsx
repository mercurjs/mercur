import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { OfferDTO, SellerDTO } from "@mercurjs/types"
import { DateCell } from "../../../../../components/table/table-cells/common/date-cell"
import { PlaceholderCell } from "../../../../../components/table/table-cells/common/placeholder-cell"
import { ReservationActions } from "./reservation-actions"
import { ExtendedReservationItem } from "../../../../inventory/inventory-detail/components/reservations-table/use-reservation-list-table-columns"

const columnHelper = createColumnHelper<ExtendedReservationItem>()

const TruncatedTextCell = ({ value }: { value?: string | null }) => {
  if (!value) {
    return <PlaceholderCell />
  }

  return (
    <div className="flex size-full items-center overflow-hidden">
      <span className="truncate">{value}</span>
    </div>
  )
}

// Product + Store come from links that may not be populated on every payload;
// read them defensively and fall back to a placeholder. Inventory is
// offer-scoped in Mercur, so the product is reached through the offer:
// inventory_item -> offers -> product.
const getProductTitle = (reservation: ExtendedReservationItem) => {
  const item = reservation.inventory_item as
    | { offers?: OfferDTO[] | null }
    | undefined
  return item?.offers?.[0]?.product?.title ?? undefined
}

const getStoreName = (reservation: ExtendedReservationItem) => {
  const item = reservation.inventory_item as
    | { seller?: SellerDTO | null }
    | undefined
  return item?.seller?.name ?? undefined
}

export const useReservationTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("inventory_item.title", {
        header: t("fields.title"),
        cell: ({ getValue }) => <TruncatedTextCell value={getValue()} />,
      }),
      columnHelper.accessor("inventory_item.sku", {
        header: t("fields.sku"),
        cell: ({ getValue }) => <TruncatedTextCell value={getValue()} />,
      }),
      columnHelper.display({
        id: "product",
        header: t("reservations.fields.product"),
        cell: ({ row }) => (
          <TruncatedTextCell value={getProductTitle(row.original)} />
        ),
      }),
      columnHelper.display({
        id: "store",
        header: t("reservations.fields.store"),
        cell: ({ row }) => (
          <TruncatedTextCell value={getStoreName(row.original)} />
        ),
      }),
      columnHelper.accessor("description", {
        header: t("fields.description"),
        cell: ({ getValue }) => <TruncatedTextCell value={getValue()} />,
      }),
      columnHelper.accessor("quantity", {
        header: t("fields.quantity"),
        cell: ({ getValue }) => (
          <div className="flex size-full items-center overflow-hidden">
            <span className="truncate">{getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: t("reservations.fields.date"),
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const reservation = row.original

          return <ReservationActions reservation={reservation} />
        },
      }),
    ],
    [t]
  )
}
