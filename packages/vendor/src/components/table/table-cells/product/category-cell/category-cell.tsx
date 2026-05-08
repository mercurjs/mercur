import { Tooltip } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ProductCategoryDTO } from "@mercurjs/types"
import { PlaceholderCell } from "../../common/placeholder-cell"

type CategoryCellProps = {
  categories?: ProductCategoryDTO[] | null
}

export const CategoryCell = ({ categories }: CategoryCellProps) => {
  const { t } = useTranslation()

  if (!categories || !categories.length) {
    return <PlaceholderCell />
  }

  const [first, ...rest] = categories

  return (
    <div className="flex h-full w-full items-center gap-x-1 overflow-hidden">
      <span title={first.name} className="truncate">
        {first.name}
      </span>
      {rest.length > 0 && (
        <Tooltip
          content={
            <ul>
              {rest.map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
          }
        >
          <span className="text-ui-fg-subtle txt-compact-small">
            {t("general.plusCountMore", { count: rest.length })}
          </span>
        </Tooltip>
      )}
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
