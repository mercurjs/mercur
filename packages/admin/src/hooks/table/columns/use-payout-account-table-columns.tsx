import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { DateCell } from "../../../components/table/table-cells/common/date-cell"
import { StatusCell } from "../../../components/table/table-cells/common/status-cell"
import {
  TextCell,
  TextHeader,
} from "../../../components/table/table-cells/common/text-cell"
import { AdminPayoutAccount } from "../../api/payout-accounts"
import {
  getPayoutAccountKycProps,
  getPayoutAccountStatusProps,
} from "../../../pages/payout-accounts/common/utils"

const columnHelper = createColumnHelper<AdminPayoutAccount>()

export const usePayoutAccountTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.display({
        id: "store",
        header: () => <TextHeader text={t("payoutAccounts.fields.store")} />,
        cell: ({ row }) => <TextCell text={row.original.seller?.name} />,
      }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text={t("fields.status")} />,
        cell: ({ getValue }) => {
          const { color, label } = getPayoutAccountStatusProps(getValue(), t)
          return <StatusCell color={color}>{label}</StatusCell>
        },
      }),
      columnHelper.accessor("kyc_status", {
        header: () => (
          <TextHeader text={t("payoutAccounts.fields.kycStatus")} />
        ),
        cell: ({ getValue }) => {
          const props = getPayoutAccountKycProps(getValue(), t)
          if (!props) {
            return <TextCell />
          }
          return <StatusCell color={props.color}>{props.label}</StatusCell>
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => <TextHeader text={t("fields.createdAt")} />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("updated_at", {
        header: () => <TextHeader text={t("fields.updatedAt")} />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
    ],
    [t],
  )
}
