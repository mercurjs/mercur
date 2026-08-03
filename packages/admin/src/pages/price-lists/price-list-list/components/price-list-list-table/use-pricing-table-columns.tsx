import { HttpTypes } from "@medusajs/types"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { StatusCell } from "../../../../../components/table/table-cells/common/status-cell"
import {
  TextCell,
  TextHeader,
} from "../../../../../components/table/table-cells/common/text-cell"
import { getPriceListStatus } from "../../../common/utils"

type PriceListWithSeller = HttpTypes.AdminPriceList & {
  seller?: { name?: string | null } | null
}

const columnHelper = createColumnHelper<PriceListWithSeller>()

export const usePricingTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("title", {
        header: () => <TextHeader text={t("fields.title")} />,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("type", {
        header: () => <TextHeader text={t("priceLists.fields.type.label")} />,
        cell: (info) => (
          <TextCell
            text={
              info.getValue() === "sale"
                ? t("priceLists.fields.type.options.sale.label")
                : t("priceLists.fields.type.options.override.label")
            }
          />
        ),
      }),
      columnHelper.accessor("prices", {
        header: () => (
          <TextHeader text={t("priceLists.fields.priceOverrides.header")} />
        ),
        cell: (info) => <TextCell text={`${info.getValue()?.length || "-"}`} />,
      }),
      columnHelper.display({
        id: "owner",
        header: () => <TextHeader text={t("priceLists.fields.owner.label")} />,
        cell: ({ row }) => (
          <TextCell
            text={
              row.original.seller?.name ||
              t("priceLists.fields.owner.marketplace")
            }
          />
        ),
      }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text={t("priceLists.fields.status.label")} />,
        cell: ({ row }) => {
          const { color, text } = getPriceListStatus(t, row.original)

          return <StatusCell color={color}>{text}</StatusCell>
        },
      }),
    ],
    [t]
  )
}
