import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { StatusCell } from "@components/table/table-cells/common/status-cell"
import {
  TextCell,
  TextHeader,
} from "@components/table/table-cells/common/text-cell"
import { getPriceListStatus } from "@pages/price-lists/common/utils"
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
      columnHelper.accessor("type", {
        header: () => <TextHeader text={t("priceLists.fields.type.label")} />,
        cell: ({ row }) => {
          const type = row.original?.type
          const text = type
            ? t(`priceLists.fields.type.options.${type}.label`)
            : "-"
          return <TextCell text={text} />
        },
      }),
      columnHelper.accessor("prices", {
        header: () => (
          <TextHeader text={t("priceLists.fields.priceOverrides.header")} />
        ),
        cell: ({ row }) => {
          const prices = row.original?.prices?.length || "-"
          return <TextCell text={prices} />
        },
      }),
      columnHelper.accessor("status", {
        header: () => (
          <TextHeader text={t("priceLists.fields.status.label")} />
        ),
        cell: ({ row }) => {
          const { color, text } = getPriceListStatus(t, row.original)

          return <StatusCell color={color}>{text}</StatusCell>
        },
      }),
    ],
    [t]
  )
}
