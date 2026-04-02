import { useTranslation } from "react-i18next"

import { StatusCell } from "../../common/status-cell"
import { SellerStatus } from "@mercurjs/types"

type SellerStatusCellProps = {
  status: SellerStatus
}

export const SellerStatusCell = ({ status }: SellerStatusCellProps) => {
  const { t } = useTranslation()

  const [color, text] = {
    [SellerStatus.OPEN]: ["green", t("stores.status.open")],
    [SellerStatus.PENDING_APPROVAL]: ["orange", t("stores.status.pendingApproval")],
    [SellerStatus.SUSPENDED]: ["red", t("stores.status.suspended")],
    [SellerStatus.TERMINATED]: ["grey", t("stores.status.terminated")],
  }[status] as ["green" | "orange" | "red" | "grey", string]

  return <StatusCell color={color}>{text}</StatusCell>
}
