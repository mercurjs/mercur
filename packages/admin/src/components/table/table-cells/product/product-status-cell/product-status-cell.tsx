import { useTranslation } from "react-i18next"

import { StatusCell } from "../../common/status-cell"
import { ProductStatus, ProductStatusValues } from "@mercurjs/types"

type ProductStatusCellProps = {
  status: ProductStatus
}

export const ProductStatusCell = ({ status }: ProductStatusCellProps) => {
  const { t } = useTranslation()

  const [color, text] = {
    [ProductStatusValues.DRAFT]: ["grey", t("products.productStatus.draft")],
    [ProductStatusValues.PROPOSED]: ["orange", t("products.productStatus.proposed")],
    [ProductStatusValues.PUBLISHED]: ["green", t("products.productStatus.published")],
    [ProductStatusValues.REQUIRES_ACTION]: ["blue", t("products.productStatus.requires_action")],
    [ProductStatusValues.REJECTED]: ["red", t("products.productStatus.rejected")],
  }[status] as ["grey" | "orange" | "green" | "blue" | "red", string]

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
