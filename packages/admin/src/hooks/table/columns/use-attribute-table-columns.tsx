import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { DateCell } from "../../../components/table/table-cells/common/date-cell"
import { TextCell } from "../../../components/table/table-cells/common/text-cell"

const columnHelper = createColumnHelper<any>()

export const useAttributeTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => t("attributes.fields.name"),
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("handle", {
        header: () => t("attributes.fields.handle"),
        cell: ({ getValue }) => <TextCell text={getValue() || "-"} />,
      }),
      columnHelper.accessor("ui_component", {
        header: () => t("attributes.fields.type"),
        cell: ({ getValue }) => (
          <TextCell text={t(`attributes.type.${getValue()}`)} />
        ),
      }),
      columnHelper.accessor("is_filterable", {
        header: () => t("attributes.fields.filterable"),
        cell: ({ getValue }) => (
          <TextCell text={getValue() ? t("general.yes") : t("general.no")} />
        ),
      }),
      columnHelper.accessor("created_at", {
        header: () => t("fields.createdAt"),
        cell: ({ getValue }) => {
          return <DateCell date={getValue()} />
        },
      }),
    ],
    [t]
  )
}
