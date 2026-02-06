import { useTranslation } from "react-i18next"

import { PlaceholderCell } from "../../common/placeholder-cell"
import { HttpTypes } from "@medusajs/types"

type CategoryCellProps = {
  categories?: HttpTypes.AdminProductCategory[] | null
}

export const CategoryCell = ({ categories }: CategoryCellProps) => {
  if (!categories) {
    return <PlaceholderCell />
  }

  return (
    <div className="flex h-full w-full items-center overflow-hidden">
      <span className="truncate">
        {categories.map((category) => category.name).join(", ")}
      </span>
    </div>
  )
}

export const CategoryHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full items-center">
      <span>{t("fields.category")}</span>
    </div>
  )
}
