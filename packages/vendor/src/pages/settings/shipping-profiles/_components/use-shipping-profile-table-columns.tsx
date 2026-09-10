import { AdminShippingProfileResponse } from "@medusajs/types"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const columnHelper =
  createColumnHelper<AdminShippingProfileResponse["shipping_profile"]>()

export const useShippingProfileTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("fields.name"),
        cell: (cell) => cell.getValue(),
      }),
      columnHelper.accessor("type", {
        header: t("fields.type"),
        cell: (cell) => cell.getValue(),
      }),
    ],
    [t]
  )
}
