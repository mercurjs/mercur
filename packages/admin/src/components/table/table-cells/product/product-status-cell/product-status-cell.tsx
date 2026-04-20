import { useTranslation } from "react-i18next"

import { StatusCell } from "../../common/status-cell"
import { ProductStatus } from "@mercurjs/types"

type ProductStatusCellProps = {
  status: ProductStatus
}

export const ProductStatusCell = ({ status }: ProductStatusCellProps) => {
  const { t } = useTranslation()

  const [color, text] = {
    [ProductStatus.PENDING]: ["orange", t("products.productStatus.pending")],
    [ProductStatus.ACCEPTED]: ["green", t("products.productStatus.accepted")],
    [ProductStatus.CHANGES_REQUIRED]: ["blue", t("products.productStatus.changes_required")],
    [ProductStatus.REJECTED]: ["red", t("products.productStatus.rejected")],
  }[status] as ["orange" | "green" | "blue" | "red", string]

  return <StatusCell color={color}>{text}</StatusCell>
}

export const ProductStatusHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full items-center">
      <span>{t("fields.status")}</span>
    </div>
  )
}
