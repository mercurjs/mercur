import { useTranslation } from "react-i18next"

import { PlaceholderCell } from "../../common/placeholder-cell"
import { HttpTypes } from "@medusajs/types"

type CollectionCellProps = {
  collection?: HttpTypes.AdminCollection | null
  "data-testid"?: string
}

export const CollectionCell = ({ collection, "data-testid": dataTestId }: CollectionCellProps) => {
  if (!collection) {
    return <PlaceholderCell />
  }

  return (
    <div className="flex h-full w-full items-center overflow-hidden">
      <span className="truncate" data-testid={dataTestId}>{collection.title}</span>
    </div>
  )
}

export const CollectionHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full items-center" data-testid="products-table-header-collection">
      <span data-testid="products-table-header-collection-text">{t("fields.collection")}</span>
    </div>
  )
}
