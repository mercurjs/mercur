import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { StatusCell } from "@components/table/table-cells/common/status-cell"
import {
  TextCell,
  TextHeader,
} from "@components/table/table-cells/common/text-cell"
import { getPriceListStatus } from "@pages/price-lists/common/utils"
import { PriceListListTableActions } from "./price-list-list-table-actions"
import { ExtendedPriceList } from "@custom-types/price-list"

const columnHelper = createColumnHelper<ExtendedPriceList>()

export const usePricingTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("title", {
        header: () => <TextHeader text={t("fields.title")} />,
        cell: ({ row }) => {
          return row.original?.title || "-"
        },
      }),
      columnHelper.accessor("status", {
        header: t("priceLists.fields.status.label"),
        cell: ({ row }) => {
          const { color, text } = getPriceListStatus(t, row.original)

          return <StatusCell color={color}>{text}</StatusCell>
        },
      }),
      columnHelper.accessor("prices", {
        header: t("priceLists.fields.priceOverrides.header"),
        cell: ({ row }) => {
          const prices = row.original?.prices?.length || "-"
          return <TextCell text={prices} />
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <PriceListListTableActions priceList={row.original} />
        ),
      }),
    ],
    [t]
  )
}
