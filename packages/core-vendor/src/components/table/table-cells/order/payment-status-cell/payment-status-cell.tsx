import { useTranslation } from "react-i18next"
import { getOrderPaymentStatus } from "../../../../../lib/order-helpers"
import { StatusCell } from "../../common/status-cell"
import { OrderPaymentStatus } from "../../../../../types/order"

type PaymentStatusCellProps = {
  status: OrderPaymentStatus
}

export const PaymentStatusCell = ({ status }: PaymentStatusCellProps) => {
  const { t } = useTranslation()

  const { label, color } = getOrderPaymentStatus(t, status)

  return <StatusCell color={color}>{label}</StatusCell>
}

export const PaymentStatusHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full items-center">
      <span className="truncate">{t("fields.payment")}</span>
    </div>
  )
}
