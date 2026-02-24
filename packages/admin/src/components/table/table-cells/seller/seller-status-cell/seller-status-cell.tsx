import { useTranslation } from "react-i18next"

import { StatusCell } from "../../common/status-cell"
import { SellerStatus } from "@mercurjs/types"

type SellerStatusCellProps = {
  status: SellerStatus
}

export const SellerStatusCell = ({ status }: SellerStatusCellProps) => {
  const { t } = useTranslation()

  const [color, text] = {
    [SellerStatus.PENDING]: ["orange", t("sellers.status.pending")],
    [SellerStatus.ACTIVE]: ["green", t("sellers.status.active")],
    [SellerStatus.SUSPENDED]: ["red", t("sellers.status.suspended")],
  }[status] as ["orange" | "green" | "red", string]

  return <StatusCell color={color}>{text}</StatusCell>
}
