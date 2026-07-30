import { HttpTypes } from "@medusajs/types"
import { SellerDTO } from "@mercurjs/types"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import {
  CodeCell,
  CodeHeader,
} from "../../../components/table/table-cells/common/code-cell"
import {
  TextCell,
  TextHeader,
} from "../../../components/table/table-cells/common/text-cell"
import { StatusCell } from "../../../components/table/table-cells/promotion/status-cell"
import { getPromotionType } from "../../../lib/promotions"

const columnHelper = createColumnHelper<HttpTypes.AdminPromotion>()

type UsePromotionTableColumnsOptions = {
  exclude?: string[]
  order?: string[]
}

export const usePromotionTableColumns = ({
  exclude,
  order,
}: UsePromotionTableColumnsOptions = {}) => {
  const { t } = useTranslation()

  return useMemo(() => {
    const columns = [
      columnHelper.display({
        id: "code",
        header: () => <CodeHeader text={t("fields.code")} />,
        cell: ({ row }) => <CodeCell code={row.original.code!} />,
      }),

      columnHelper.display({
        id: "type",
        header: () => <TextHeader text={t("promotions.fields.type")} />,
        cell: ({ row }) => <TextCell text={getPromotionType(row.original)} />,
      }),

      columnHelper.display({
        id: "method",
        header: () => <TextHeader text={t("promotions.fields.method")} />,
        cell: ({ row }) => {
          const text = row.original.is_automatic
            ? t("promotions.form.method.automatic.title")
            : t("promotions.form.method.code.title")

          return <TextCell text={text} />
        },
      }),

      columnHelper.display({
        id: "campaign",
        header: () => <TextHeader text={t("promotions.fields.campaign")} />,
        cell: ({ row }) => (
          <TextCell text={row.original.campaign?.name ?? "-"} />
        ),
      }),

      columnHelper.display({
        id: "owner",
        header: () => <TextHeader text={t("promotions.fields.owner")} />,
        cell: ({ row }) => {
          const promotion = row.original as HttpTypes.AdminPromotion & {
            seller?: Pick<SellerDTO, "name"> | null
          }

          return (
            <TextCell
              text={
                promotion.seller?.name ?? t("promotions.fields.platformOwner")
              }
            />
          )
        },
      }),

      columnHelper.display({
        id: "status",
        header: () => <TextHeader text={t("fields.status")} />,
        cell: ({ row }) => <StatusCell promotion={row.original} />,
      }),
    ]

    const filtered = exclude?.length
      ? columns.filter((column) => !exclude.includes(column.id as string))
      : columns

    if (!order?.length) {
      return filtered
    }

    return [...filtered].sort((a, b) => {
      const aIndex = order.indexOf(a.id as string)
      const bIndex = order.indexOf(b.id as string)

      return (
        (aIndex === -1 ? order.length : aIndex) -
        (bIndex === -1 ? order.length : bIndex)
      )
    })
  }, [t, exclude, order])
}
