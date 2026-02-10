import { useTranslation } from "react-i18next"

import { Thumbnail } from "../../../../common/thumbnail"
import { HttpTypes } from "@medusajs/types"

type ProductCellProps = {
  product: Pick<HttpTypes.AdminProduct, "thumbnail" | "title">
  "data-testid"?: string
}

export const ProductCell = ({ product, "data-testid": dataTestId }: ProductCellProps) => {
  return (
    <div className="flex h-full w-full max-w-[250px] items-center gap-x-3 overflow-hidden">
      <div className="w-fit flex-shrink-0">
        <Thumbnail src={product.thumbnail} />
      </div>
      <span title={product.title} className="truncate" data-testid={dataTestId}>
        {product.title}
      </span>
    </div>
  )
}

export const ProductHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full items-center" data-testid="products-table-header-product">
      <span data-testid="products-table-header-product-text">{t("fields.product")}</span>
    </div>
  )
}
