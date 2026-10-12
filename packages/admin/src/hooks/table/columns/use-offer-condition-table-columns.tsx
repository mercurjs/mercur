import { useMemo } from "react"

import { createDataTableColumnHelper, DataTableColumnDef } from "@medusajs/ui"
import { HttpTypes } from "@mercurjs/types"
import { useTranslation } from "react-i18next"

import { DataTableStatusCell } from "../../../components/data-table/components/data-table-status-cell/data-table-status-cell"

type OfferCondition = HttpTypes.AdminOfferConditionResponse["offer_condition"]

const columnHelper = createDataTableColumnHelper<OfferCondition>()

export const useOfferConditionTableColumns = (): DataTableColumnDef<
  OfferCondition
>[] => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("label", {
        header: () => t("fields.label"),
        enableSorting: true,
        sortLabel: t("fields.label"),
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
      }),
      columnHelper.accessor("code", {
        header: () => t("fields.code"),
        enableSorting: true,
        sortLabel: t("fields.code"),
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
      }),
      columnHelper.accessor("rank", {
        header: () => t("offerConditions.fields.rank.label"),
        enableSorting: true,
        sortLabel: t("offerConditions.fields.rank.label"),
        sortAscLabel: t("general.ascending"),
        sortDescLabel: t("general.descending"),
      }),
      columnHelper.accessor("is_active", {
        header: () => t("fields.status"),
        cell: ({ getValue }) => {
          const value = getValue()
          return (
            <DataTableStatusCell color={value ? "green" : "grey"}>
              {value ? t("general.enabled") : t("general.disabled")}
            </DataTableStatusCell>
          )
        },
      }),
    ],
    [t]
  )
}
