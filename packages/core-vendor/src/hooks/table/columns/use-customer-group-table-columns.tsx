import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import { useTranslation } from "react-i18next"
import {
  TextCell,
  TextHeader,
} from "../../../components/table/table-cells/common/text-cell"
import { CustomerGroupData } from "../../../routes/orders/common/customerGroupFiltering"

const columnHelper = createColumnHelper<CustomerGroupData>()

export const useCustomerGroupTableColumns = () => {
  const { t } = useTranslation()
  return useMemo(
    () => [
      columnHelper.accessor("customer_group.name", {
        header: () => <TextHeader text={t("fields.name")} />,
        cell: ({ row }) => {
          return (
            <TextCell
              text={row.original?.customer_group?.name || "-"}
            />
          )
        },
      }),
    ],
    [t]
  )
}
